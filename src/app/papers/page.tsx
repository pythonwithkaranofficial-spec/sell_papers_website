import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { TrustBar } from "@/components/Trust";
import { CLASSES, SUBJECTS, subjectsFor } from "@/lib/catalog";
import { getCatalogSummary } from "@/lib/data";
import { SETS_PER_SUBJECT, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "All Practice Papers — Class 10 & 12",
  description: `Browse CBSE ${site.session} practice paper bundles for all ${SUBJECTS.length} subjects of Class 10 and Class 12, each with ${SETS_PER_SUBJECT} sets and complete answer keys.`,
};

export default async function PapersPage() {
  const summary = await getCatalogSummary();
  const totalAvailable = Object.values(summary).reduce((n, s) => n + s.available, 0);

  return (
    <>
      <section className="hero-dark text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <nav className="text-sm text-white/60">
            <Link href="/" className="hover:text-white">
              Home
            </Link>{" "}
            / <span className="text-white">All papers</span>
          </nav>
          <p className="eyebrow mt-6 !text-gold-bright">CBSE Session {site.session}</p>
          <h1 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">All practice papers</h1>
          <p className="mt-3 max-w-2xl text-white/70">
            {SUBJECTS.length} subjects across Class 10 and Class 12 · {SETS_PER_SUBJECT} sets per subject
            {totalAvailable > 0 ? ` · ${totalAvailable} sets ready to download now` : ""}.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {CLASSES.map((c) => (
              <a key={c.level} href={`#class-${c.level}`} className="btn btn-ghost-light !py-2 text-sm">
                {c.title} · {subjectsFor(c.level).length} subjects
              </a>
            ))}
          </div>
        </div>
      </section>
      <TrustBar className="!border-t-0" />

      {CLASSES.map((c) => (
        <section key={c.level} id={`class-${c.level}`} className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="eyebrow">{c.subtitle}</p>
              <h2 className="font-display mt-1 text-3xl font-semibold">{c.title}</h2>
            </div>
            <Link href={`/classes/${c.level}`} className="text-sm font-semibold text-ink-soft hover:text-gold">
              {c.title} by stream →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {subjectsFor(c.level).map((s) => (
              <ProductCard key={s.id} subject={s} summary={summary[s.id]} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
