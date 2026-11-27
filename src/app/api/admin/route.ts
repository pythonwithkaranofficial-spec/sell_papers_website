import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
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
export async function POST(req: Request) {
  const user = await getUser();
  if (!(await isAdmin(user))) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const admin = createAdminClient();
  const kind = String(b.kind || "");
  const paperId = String(b.paperId || "");

  const res = await handle(b, admin, kind, paperId);
  // Uploads, deletions and price changes must show on the (cached) store pages immediately.
  if (b.action !== "upload-url" && res.ok) revalidateTag(CATALOG_TAG, { expire: 0 });
  return res;
}

async function handle(b: Record<string, unknown>, admin: ReturnType<typeof createAdminClient>, kind: string, paperId: string) {
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
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}
