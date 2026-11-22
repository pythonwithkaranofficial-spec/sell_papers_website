import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButton } from "@/components/BuyButton";
import { FileBadge } from "@/components/FileBadge";
import { FILE_KINDS, SUBJECTS, findSubject } from "@/lib/catalog";
import { getSubjectDetail, type SetInfo } from "@/lib/data";
import { formatINR, SETS_PER_SUBJECT, site } from "@/lib/site";
import { getUser } from "@/lib/supabase/server";

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ level: s.classLevel, subject: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ level: string; subject: string }> }): Promise<Metadata> {
  const { level, subject } = await params;
  const s = findSubject(level, subject);
  return { title: s ? `Class ${level} ${s.name} (${s.code}) Practice Papers` : "Subject" };
}

export default async function SubjectPage({ params }: { params: Promise<{ level: string; subject: string }> }) {
  const { level, subject: slug } = await params;
  const subject = findSubject(level, slug);
  if (!subject) notFound();
  const user = await getUser();
  const detail = await getSubjectDetail(subject, user?.id ?? null);
  const available = detail.sets.filter((s) => s.published).length;
  const path = `/classes/${level}/${slug}`;
  const hindi = subject.language === "hi" ? "font-[family-name:var(--font-hindi)]" : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <nav className="text-sm text-muted">
        <Link href="/" className="hover:text-ink">Home</Link> / <Link href={`/classes/${level}`} className="hover:text-ink">Class {level}</Link> /{" "}
        <span className="text-ink">{subject.name}</span>
      </nav>

      <header className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div>
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-line" aria-hidden>{subject.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gold">Class {level} · Subject code {subject.code} · Session {site.session}</p>
              <h1 className={`font-display text-3xl font-semibold sm:text-4xl ${hindi}`}>{subject.name}</h1>
            </div>
          </div>
          <p className={`mt-5 max-w-2xl text-ink-soft ${hindi}`}>{subject.blurb}</p>
          <ul className="mt-6 flex flex-wrap gap-2 text-sm">
            <li className="chip bg-white ring-1 ring-line">{SETS_PER_SUBJECT} sets</li>
            <li className="chip bg-white ring-1 ring-line">Official 2026-27 SQP pattern</li>
            <li className="chip bg-white ring-1 ring-line">Answer key &amp; marking scheme</li>
            <li className="chip bg-white ring-1 ring-line">{available ? `${available} available now` : "Uploading soon"}</li>
          </ul>
        </div>

        <aside className="card p-6">
          <p className="text-sm font-semibold text-muted">Complete subject bundle</p>
          <p className="font-display mt-1 text-4xl font-semibold">{formatINR(detail.bundlePricePaise)}</p>
          <p className="mt-2 text-sm text-muted">
            All {SETS_PER_SUBJECT} sets of {subject.name} — including sets added later. Word files, PDFs and answer keys.
          </p>
          <div className="mt-5">
            {detail.ownsBundle ? (
              <Link href="/account" className="btn btn-outline w-full">✓ You own this bundle — My papers</Link>
            ) : detail.live && detail.bundleOnSale && available > 0 ? (
              <BuyButton type="subject" subjectId={subject.id} label={`Buy all ${SETS_PER_SUBJECT} sets`} className="btn btn-gold w-full" signedIn={!!user} returnTo={path} />
            ) : (
              <button className="btn btn-outline w-full" disabled>Available soon</button>
            )}
          </div>
        </aside>
      </header>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">All sets</h2>
          <p className="text-sm text-muted">Each set: question paper (Word) + question paper with answer key (PDF)</p>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {detail.sets.map((set) => (
            <SetCard key={set.setNo} set={set} subjectName={subject.name} signedIn={!!user} returnTo={path} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SetCard({ set, subjectName, signedIn, returnTo }: { set: SetInfo; subjectName: string; signedIn: boolean; returnTo: string }) {
  const kinds = FILE_KINDS.filter((k) => !("optional" in k) || set.files.includes(k.kind));
  return (
    <article className={`card flex flex-col p-5 ${set.owned ? "ring-2 ring-teal/40" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{subjectName}</p>
          <h3 className="font-display mt-1 text-xl font-semibold">{set.title}</h3>
        </div>
        {set.owned ? (
          <span className="chip bg-teal-soft text-teal">Owned</span>
        ) : set.published ? (
          <span className="chip bg-gold-soft text-gold">{formatINR(set.pricePaise)}</span>
        ) : (
          <span className="chip bg-paper-deep text-muted">Coming soon</span>
        )}
      </div>
      <ul className="mt-4 flex-1 space-y-2.5">
        {kinds.map((k) => {
          const has = set.files.includes(k.kind);
          return (
            <li key={k.kind} className="flex items-center gap-3">
              <FileBadge kind={k.kind} small />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{k.label}</p>
                <p className="text-xs text-muted">{k.format}{has ? "" : " · placeholder"}</p>
              </div>
              {set.owned && has && set.paperId && (
                <a href={`/api/download?paper=${set.paperId}&kind=${k.kind}`} className="text-sm font-semibold text-teal hover:underline">
                  Download
                </a>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-5">
        {set.owned ? (
          <Link href="/account" className="btn btn-outline w-full text-sm">Open in My papers</Link>
        ) : set.published && set.paperId ? (
          <BuyButton type="paper" paperId={set.paperId} label={`Buy for ${formatINR(set.pricePaise)}`} signedIn={signedIn} returnTo={returnTo} />
        ) : (
          <button className="btn btn-outline w-full text-sm" disabled>Coming soon</button>
        )}
      </div>
    </article>
  );
}
