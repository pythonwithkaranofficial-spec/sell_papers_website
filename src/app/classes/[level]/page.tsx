import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ProductCard } from "@/components/ProductCard";
import { SubjectCover } from "@/components/SubjectCover";
import { TrustBar } from "@/components/Trust";
import { CLASSES, subjectsFor, type ClassLevel } from "@/lib/catalog";
import { getCatalogSummary } from "@/lib/data";
import { SETS_PER_SUBJECT, site } from "@/lib/site";

export function generateStaticParams() {
  return CLASSES.map((c) => ({ level: c.level }));
}

export async function generateMetadata({ params }: { params: Promise<{ level: string }> }): Promise<Metadata> {
  const { level } = await params;
  return {
    title: `Class ${level} Practice Papers ${site.session}`,
    description: `CBSE Class ${level} practice papers for session ${site.session} — ${SETS_PER_SUBJECT} sets per subject with answer keys and marking schemes. Instant download.`,
  };
}

export default async function ClassPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  const cls = CLASSES.find((c) => c.level === level);
  if (!cls) notFound();
  const subjects = subjectsFor(level as ClassLevel);
  const summary = await getCatalogSummary();
  const streams = [...new Set(subjects.map((s) => s.stream))];
  const ready = subjects.reduce((n, s) => n + summary[s.id].available, 0);

  return (
    <>
      <section className="hero-dark overflow-hidden text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto]">
          <div>
            <nav className="text-sm text-white/60">
              <Link href="/" className="hover:text-white">
                Home
              </Link>{" "}
              / <span className="text-white">{cls.title}</span>
            </nav>
            <p className="eyebrow mt-6 !text-gold-bright">{cls.subtitle}</p>
            <h1 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">{cls.title} Practice Papers</h1>
            <p className="mt-3 max-w-2xl text-white/70">
              {subjects.length} subjects · {SETS_PER_SUBJECT} sets each · built on the official CBSE {site.session} pattern, with complete
              answer keys{ready > 0 ? ` · ${ready} sets ready to download` : ""}.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {CLASSES.map((c) => (
                <Link
                  key={c.level}
                  href={`/classes/${c.level}`}
                  className={`btn !py-2 text-sm ${c.level === level ? "bg-white text-ink" : "btn-ghost-light"}`}
                >
                  {c.title}
                </Link>
              ))}
              <span className="mx-1 hidden w-px bg-white/15 sm:block" />
              {streams.map((st) => (
                <a key={st} href={`#${st.toLowerCase().replace(/\s+/g, "-")}`} className="btn btn-ghost-light !py-2 text-sm">
                  {st}
                </a>
              ))}
            </div>
          </div>
          <div className="hidden gap-3 lg:flex" aria-hidden="true">
            {subjects.slice(0, 3).map((s, i) => (
              <div key={s.id} className={`w-[120px] ${i === 1 ? "-translate-y-4" : ""}`}>
                <SubjectCover subject={s} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <TrustBar className="!border-t-0" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {streams.map((stream) => (
          <section key={stream} id={stream.toLowerCase().replace(/\s+/g, "-")} className="scroll-mt-20 pt-14">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-semibold">{stream}</h2>
              <span className="chip bg-paper-deep text-muted">{subjects.filter((s) => s.stream === stream).length} subjects</span>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {subjects
                .filter((s) => s.stream === stream)
                .map((s) => (
                  <ProductCard key={s.id} subject={s} summary={summary[s.id]} />
                ))}
            </div>
          </section>
        ))}

        <div className="card mt-16 flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-soft text-gold">
              <Icon name="headset" className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold">Can&apos;t find your subject?</p>
              <p className="mt-1 text-sm text-muted">Tell us which subject you need — your requests help us decide what to add next.</p>
            </div>
          </div>
          <Link href="/contact" className="btn btn-outline">
            Contact us
          </Link>
        </div>
      </div>
    </>
  );
}
