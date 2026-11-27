import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { findUserByEmail, isOwner, toPaise } from "@/lib/admin";
import { SUBJECTS } from "@/lib/catalog";
import { CATALOG_TAG } from "@/lib/data";
import { DEFAULT_BUCKET, resolveStoragePath } from "@/lib/storage";
import { createAdminClient, getUser, isAdmin } from "@/lib/supabase/server";

const KINDS = ["docx", "pdf", "answer_key"] as const;

// Admin actions (all require an admin account):
//   { action: "upload-url", paperId, kind }            -> signed upload URL for the private bucket
//   { action: "file-uploaded", paperId, kind, path, fileName, size }
//   { action: "delete-file", paperId, kind }
//   { action: "update-paper", paperId, pricePaise?, isPublished? }
//   { action: "update-subject", subjectId, bundlePricePaise?, bundleOnSale? }
//   { action: "bulk-prices", subjectIds[], setPrice?, bundlePrice?, percent?, percentTarget?, bundleOnSale?, setsOnSale? }  (rupees)
//   { action: "add-admin", email } / { action: "remove-admin", userId }  (owners only)
//   { action: "grant-access", email, subjectId, setNo? } / { action: "revoke-access", purchaseId }
//   { action: "customer", email }  -> that customer's purchases
export async function POST(req: Request) {
  const user = await getUser();
  if (!(await isAdmin(user))) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const admin = createAdminClient();
  const kind = String(b.kind || "");
  const paperId = String(b.paperId || "");

  const res = await handle(b, admin, kind, paperId, user);
  // Uploads, deletions and price changes must show on the (cached) store pages immediately.
  if (CATALOG_CHANGES.has(String(b.action)) && res.ok) revalidateTag(CATALOG_TAG, { expire: 0 });
  return res;
}

const CATALOG_CHANGES = new Set(["file-uploaded", "delete-file", "update-paper", "update-subject", "bulk-prices"]);
const VALID_SUBJECTS = new Set(SUBJECTS.map((s) => s.id));
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function handle(
  b: Record<string, unknown>,
  admin: ReturnType<typeof createAdminClient>,
  kind: string,
  paperId: string,
  user: Awaited<ReturnType<typeof getUser>>,
) {
  switch (b.action) {
    case "upload-url": {
      if (!KINDS.includes(kind as (typeof KINDS)[number])) return NextResponse.json({ error: "bad kind" }, { status: 400 });
      const { data: paper } = await admin.from("papers").select("subject_id,set_no").eq("id", paperId).maybeSingle();
      if (!paper) return NextResponse.json({ error: "paper not found" }, { status: 404 });
      const ext = kind === "docx" ? "docx" : "pdf";
      const path = `${paper.subject_id}/set-${String(paper.set_no).padStart(2, "0")}/${kind}-${Date.now()}.${ext}`;
      const { data, error } = await admin.storage.from(DEFAULT_BUCKET).createSignedUploadUrl(path);
      if (error || !data) return NextResponse.json({ error: error?.message || "upload url failed" }, { status: 500 });
      return NextResponse.json({ path, token: data.token });
    }
    case "file-uploaded": {
      const { data: old } = await admin.from("paper_files").select("storage_path").eq("paper_id", paperId).eq("kind", kind).maybeSingle();
      const { error } = await admin.from("paper_files").upsert(
        { paper_id: paperId, kind, storage_path: String(b.path), file_name: String(b.fileName || ""), size_bytes: Number(b.size || 0), uploaded_at: new Date().toISOString() },
        { onConflict: "paper_id,kind" },
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (old?.storage_path && old.storage_path !== b.path) {
        const o = resolveStoragePath(old.storage_path);
        await admin.storage.from(o.bucket).remove([o.path]);
      }
      await admin.from("papers").update({ is_published: true, updated_at: new Date().toISOString() }).eq("id", paperId);
      return NextResponse.json({ ok: true });
    }
    case "delete-file": {
      const { data: f } = await admin.from("paper_files").select("id,storage_path").eq("paper_id", paperId).eq("kind", kind).maybeSingle();
      if (f) {
        const o = resolveStoragePath(f.storage_path);
        await admin.storage.from(o.bucket).remove([o.path]);
        await admin.from("paper_files").delete().eq("id", f.id);
      }
      const { count } = await admin.from("paper_files").select("id", { count: "exact", head: true }).eq("paper_id", paperId);
      if (!count) await admin.from("papers").update({ is_published: false }).eq("id", paperId);
      return NextResponse.json({ ok: true });
    }
    case "update-paper": {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (b.pricePaise !== undefined) patch.price_paise = Math.max(100, Math.round(Number(b.pricePaise)));
      if (b.isPublished !== undefined) patch.is_published = Boolean(b.isPublished);
      const { error } = await admin.from("papers").update(patch).eq("id", paperId);
      return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
    }
    case "update-subject": {
      const patch: Record<string, unknown> = {};
      if (b.bundlePricePaise !== undefined) patch.bundle_price_paise = Math.max(100, Math.round(Number(b.bundlePricePaise)));
      if (b.bundleOnSale !== undefined) patch.is_bundle_on_sale = Boolean(b.bundleOnSale);
      const { error } = await admin.from("subjects").update(patch).eq("id", String(b.subjectId));
      return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
    }
    case "bulk-prices": {
      const ids = (Array.isArray(b.subjectIds) ? b.subjectIds : []).map(String).filter((id) => VALID_SUBJECTS.has(id));
      if (!ids.length) return bad("Select at least one subject.");
      const setPaise = b.setPrice !== undefined && b.setPrice !== "" ? toPaise(b.setPrice) : null;
      const bundlePaise = b.bundlePrice !== undefined && b.bundlePrice !== "" ? toPaise(b.bundlePrice) : null;
      const percent = b.percent !== undefined && b.percent !== "" ? Number(b.percent) : null;
      if (percent !== null && (!Number.isFinite(percent) || percent <= -100 || percent > 1000)) return bad("Percentage must be between -99 and 1000.");
      const target = String(b.percentTarget || "both");
      const now = () => new Date().toISOString();
      const changes: string[] = [];

      if (setPaise !== null) {
        const { error } = await admin.from("papers").update({ price_paise: setPaise, updated_at: now() }).in("subject_id", ids);
        if (error) return bad(error.message, 500);
        changes.push(`set price Rs ${setPaise / 100}`);
      }
      if (bundlePaise !== null) {
        const { error } = await admin.from("subjects").update({ bundle_price_paise: bundlePaise }).in("id", ids);
        if (error) return bad(error.message, 500);
        changes.push(`bundle price Rs ${bundlePaise / 100}`);
      }
      if (percent !== null && percent !== 0) {
        const scale = (paise: number) => Math.max(100, Math.round((paise * (1 + percent / 100)) / 100) * 100);
        if (target === "sets" || target === "both") {
          const { data, error } = await admin.from("papers").select("id,price_paise").in("subject_id", ids).limit(5000);
          if (error) return bad(error.message, 500);
          const groups = new Map<number, string[]>();
          for (const p of data ?? []) {
            const np = scale(p.price_paise as number);
            groups.set(np, [...(groups.get(np) ?? []), p.id as string]);
          }
          for (const [np, pids] of groups) {
            for (let i = 0; i < pids.length; i += 200) {
              const { error: e } = await admin.from("papers").update({ price_paise: np, updated_at: now() }).in("id", pids.slice(i, i + 200));
              if (e) return bad(e.message, 500);
            }
          }
        }
        if (target === "bundles" || target === "both") {
          const { data, error } = await admin.from("subjects").select("id,bundle_price_paise").in("id", ids);
          if (error) return bad(error.message, 500);
          for (const s of data ?? []) {
            const { error: e } = await admin.from("subjects").update({ bundle_price_paise: scale(s.bundle_price_paise as number) }).eq("id", s.id);
            if (e) return bad(e.message, 500);
          }
        }
        changes.push(`${percent > 0 ? "+" : ""}${percent}% on ${target === "both" ? "sets and bundles" : target}`);
      }
      if (typeof b.bundleOnSale === "boolean") {
        const { error } = await admin.from("subjects").update({ is_bundle_on_sale: b.bundleOnSale }).in("id", ids);
        if (error) return bad(error.message, 500);
        changes.push(b.bundleOnSale ? "bundles on sale" : "bundles off sale");
      }
      if (typeof b.setsOnSale === "boolean") {
        if (b.setsOnSale) {
          // Only sets that have uploaded files can go on sale.
          const { data: papers } = await admin.from("papers").select("id,paper_files(kind)").in("subject_id", ids).limit(5000);
          const pids = (papers ?? []).filter((p) => ((p.paper_files as unknown[] | null) ?? []).length > 0).map((p) => p.id as string);
          if (!pids.length) return bad("None of the selected subjects have uploaded files yet.");
          for (let i = 0; i < pids.length; i += 200) {
            const { error } = await admin.from("papers").update({ is_published: true, updated_at: now() }).in("id", pids.slice(i, i + 200));
            if (error) return bad(error.message, 500);
          }
          changes.push(`${pids.length} sets with files on sale`);
        } else {
          const { error } = await admin.from("papers").update({ is_published: false, updated_at: now() }).in("subject_id", ids);
          if (error) return bad(error.message, 500);
          changes.push("all sets off sale");
        }
      }
      if (!changes.length) return bad("Nothing to change. Enter a price or a percentage, or choose an on/off-sale option.");
      return NextResponse.json({ ok: true, message: `Updated ${ids.length} subject(s): ${changes.join(", ")}.` });
    }
    case "add-admin": {
      if (!isOwner(user)) return bad("Only the owner (an email in ADMIN_EMAILS) can add admins.", 403);
      const target = await findUserByEmail(admin, String(b.email || ""));
      if (!target) return bad("No account with that email. Ask the person to create an account on the website first.", 404);
      const { error } = await admin.from("profiles").upsert({ id: target.id, is_admin: true }, { onConflict: "id" });
      if (error) return bad(error.message, 500);
      return NextResponse.json({ ok: true, message: `${target.email} is now an admin.` });
    }
    case "remove-admin": {
      if (!isOwner(user)) return bad("Only the owner (an email in ADMIN_EMAILS) can remove admins.", 403);
      const id = String(b.userId || "");
      if (!id) return bad("Missing user.");
      const { error } = await admin.from("profiles").update({ is_admin: false }).eq("id", id);
      if (error) return bad(error.message, 500);
      return NextResponse.json({ ok: true, message: "Admin removed." });
    }
    case "customer": {
      const target = await findUserByEmail(admin, String(b.email || ""));
      if (!target) return bad("No account with that email.", 404);
      const { data, error } = await admin
        .from("purchases")
        .select("id,paper_id,subject_id,order_id,created_at,papers(set_no,subject_id)")
        .eq("user_id", target.id)
        .order("created_at", { ascending: false });
      if (error) return bad(error.message, 500);
      return NextResponse.json({ ok: true, user: { id: target.id, email: target.email, createdAt: target.created_at }, purchases: data ?? [] });
    }
    case "grant-access": {
      const target = await findUserByEmail(admin, String(b.email || ""));
      if (!target) return bad("No account with that email. The customer must create an account first.", 404);
      const subjectId = String(b.subjectId || "");
      if (!VALID_SUBJECTS.has(subjectId)) return bad("Choose a subject.");
      const setNo = b.setNo ? Number(b.setNo) : null;
      let row: Record<string, unknown> = { user_id: target.id, subject_id: subjectId };
      if (setNo) {
        const { data: paper } = await admin.from("papers").select("id").eq("subject_id", subjectId).eq("set_no", setNo).maybeSingle();
        if (!paper) return bad(`Set ${setNo} not found.`);
        row = { user_id: target.id, paper_id: paper.id };
      }
      const { error } = await admin.from("purchases").insert(row);
      if (error) return error.code === "23505" ? bad("This customer already has that access.", 409) : bad(error.message, 500);
      return NextResponse.json({ ok: true, message: `Access given to ${target.email}.` });
    }
    case "revoke-access": {
      const id = String(b.purchaseId || "");
      if (!id) return bad("Missing purchase.");
      const { error } = await admin.from("purchases").delete().eq("id", id);
      if (error) return bad(error.message, 500);
      return NextResponse.json({ ok: true, message: "Access removed." });
    }
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
