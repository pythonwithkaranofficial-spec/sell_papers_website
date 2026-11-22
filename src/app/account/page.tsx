import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileBadge } from "@/components/FileBadge";
import { FILE_KINDS } from "@/lib/catalog";
import { getLibrary } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My papers" };

export default async function AccountPage() {
  if (!isSupabaseConfigured) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login?next=/account");
  const { items, bundles } = await getLibrary(user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">My account</p>
          <h1 className="font-display mt-2 text-4xl font-semibold">My papers</h1>
          <p className="mt-2 text-sm text-muted">Signed in as {user.email}</p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn btn-outline text-sm">Sign out</button>
        </form>
      </div>

      {bundles.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {bundles.map((b) => (
            <span key={b.id} className="chip bg-teal-soft text-teal">✓ Bundle: Class {b.classLevel} {b.name}</span>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="font-display text-2xl font-semibold">No papers yet</p>
          <p className="mt-2 text-muted">Papers you buy appear here, ready to download any time.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/classes/10" className="btn btn-primary">Class 10 papers</Link>
            <Link href="/classes/12" className="btn btn-gold">Class 12 papers</Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {items.map(({ subject, set }) => (
            <div key={set.paperId} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Class {subject.classLevel} · {subject.name}</p>
                <p className="font-display text-lg font-semibold">{set.title}</p>
              </div>
              {set.files.length === 0 ? (
                <span className="text-sm text-muted">Files are being uploaded — check back soon.</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {FILE_KINDS.filter((k) => set.files.includes(k.kind)).map((k) => (
                    <a key={k.kind} href={`/api/download?paper=${set.paperId}&kind=${k.kind}`} className="btn btn-outline !py-2 text-sm">
                      <FileBadge kind={k.kind} small /> {k.kind === "docx" ? "Word" : k.kind === "pdf" ? "PDF + Answer key" : "Answer key"}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
