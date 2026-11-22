import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSetRow, AdminSubjectPrice } from "@/components/AdminControls";
import { CLASSES, SUBJECTS, subjectsFor } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createAdminClient, getUser, isAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  if (!isSupabaseConfigured) {
    return <Notice text="Connect Supabase (see README) to use the admin panel." />;
  }
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  if (!(await isAdmin(user))) return <Notice text="This page is only for administrators." />;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return <Notice text="Add SUPABASE_SERVICE_ROLE_KEY to the environment to manage papers." />;

  const { subject: subjectId = SUBJECTS[0].id } = await searchParams;
  const subject = SUBJECTS.find((s) => s.id === subjectId) ?? SUBJECTS[0];
  const admin = createAdminClient();
  const [{ data: subj }, { data: papers }, { count: paidOrders }] = await Promise.all([
    admin.from("subjects").select("bundle_price_paise,is_bundle_on_sale").eq("id", subject.id).maybeSingle(),
    admin.from("papers").select("id,set_no,title,price_paise,is_published,paper_files(kind,file_name,size_bytes)").eq("subject_id", subject.id).order("set_no"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Admin</p>
          <h1 className="font-display mt-1 text-3xl font-semibold">Manage papers</h1>
        </div>
        <p className="text-sm text-muted">Paid orders so far: <strong className="text-ink">{paidOrders ?? 0}</strong></p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="card h-fit p-3">
          {CLASSES.map((c) => (
            <div key={c.level} className="mb-3">
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">{c.title}</p>
              {subjectsFor(c.level).map((s) => (
                <Link
                  key={s.id}
                  href={`/admin?subject=${s.id}`}
                  className={`block rounded-lg px-3 py-1.5 text-sm ${s.id === subject.id ? "bg-ink text-white" : "hover:bg-paper"}`}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          ))}
        </aside>

        <section>
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Class {subject.classLevel} · Code {subject.code}</p>
                <h2 className="font-display text-2xl font-semibold">{subject.name}</h2>
              </div>
              <AdminSubjectPrice subjectId={subject.id} pricePaise={subj?.bundle_price_paise ?? 99900} onSale={subj?.is_bundle_on_sale ?? true} />
            </div>
            <p className="mt-3 text-xs text-muted">
              Upload the Word file (question paper) and the PDF (question paper + answer key) for each set. A set goes on sale automatically once
              a file is uploaded; you can hide it with the toggle. An optional separate answer key file can also be uploaded.
            </p>
          </div>

          {!papers?.length ? (
            <Notice text="No sets found for this subject. Run supabase/seed.sql in the Supabase SQL editor." inline />
          ) : (
            <div className="mt-5 space-y-3">
              {papers.map((p) => (
                <AdminSetRow
                  key={p.id}
                  paperId={p.id}
                  title={p.title}
                  pricePaise={p.price_paise}
                  published={p.is_published}
                  files={(p.paper_files as { kind: string; file_name: string; size_bytes: number | null }[]) ?? []}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Notice({ text, inline }: { text: string; inline?: boolean }) {
  return (
    <div className={inline ? "card mt-5 p-6 text-sm text-muted" : "mx-auto max-w-xl px-4 py-24 text-center"}>
      {inline ? text : <div className="card p-8 text-ink-soft">{text}</div>}
    </div>
  );
}
