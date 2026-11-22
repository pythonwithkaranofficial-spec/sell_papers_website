import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CLASSES, subjectsFor, type ClassLevel } from "@/lib/catalog";
import { getPublishedCounts } from "@/lib/data";
import { SETS_PER_SUBJECT } from "@/lib/site";

export function generateStaticParams() {
  return CLASSES.map((c) => ({ level: c.level }));
}

export async function generateMetadata({ params }: { params: Promise<{ level: string }> }): Promise<Metadata> {
  const { level } = await params;
  return { title: `Class ${level} Practice Papers` };
}

export default async function ClassPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  const cls = CLASSES.find((c) => c.level === level);
  if (!cls) notFound();
  const subjects = subjectsFor(level as ClassLevel);
  const counts = await getPublishedCounts(level as ClassLevel);
  const streams = [...new Set(subjects.map((s) => s.stream))];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <nav className="text-sm text-muted">
        <Link href="/" className="hover:text-ink">Home</Link> / <span className="text-ink">{cls.title}</span>
      </nav>
      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">{cls.subtitle}</p>
          <h1 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">{cls.title} Practice Papers</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            {subjects.length} subjects · {SETS_PER_SUBJECT} sets each · official CBSE 2026-27 pattern with answer keys.
          </p>
        </div>
        <div className="flex gap-2">
          {CLASSES.map((c) => (
            <Link key={c.level} href={`/classes/${c.level}`} className={`btn !py-2 text-sm ${c.level === level ? "btn-primary" : "btn-outline"}`}>
              {c.title}
            </Link>
          ))}
        </div>
      </header>

      {streams.map((stream) => (
        <section key={stream} className="mt-12">
          <h2 className="font-display text-xl font-semibold">{stream}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {subjects
              .filter((s) => s.stream === stream)
              .map((s) => {
                const ready = counts[s.id] ?? 0;
                return (
                  <Link key={s.id} href={`/classes/${level}/${s.slug}`} className="card group flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-paper-deep text-2xl" aria-hidden>{s.icon}</span>
                      <span className="chip bg-paper text-muted">Code {s.code}</span>
                    </div>
                    <h3 className={`mt-4 text-lg font-semibold ${s.language === "hi" ? "font-[family-name:var(--font-hindi)]" : ""}`}>{s.name}</h3>
                    <p className={`mt-1.5 flex-1 text-sm leading-relaxed text-muted ${s.language === "hi" ? "font-[family-name:var(--font-hindi)]" : ""}`}>{s.blurb}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm">
                      <span className={ready ? "font-semibold text-teal" : "text-muted"}>
                        {ready ? `${ready} of ${SETS_PER_SUBJECT} sets available` : "Coming soon"}
                      </span>
                      <span className="font-semibold group-hover:text-gold">View sets →</span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
