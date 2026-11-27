import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButton } from "@/components/BuyButton";
import { FileBadge } from "@/components/FileBadge";
import { Icon, type IconName } from "@/components/Icon";
import { PaperPreview } from "@/components/PaperPreview";
import { Availability, ProductCard, bundleSaving } from "@/components/ProductCard";
import { SubjectCover } from "@/components/SubjectCover";
import { Faq, PaymentMethods, SectionTitle } from "@/components/Trust";
import { FILE_KINDS, SUBJECTS, classRoman, findSubject, subjectsFor } from "@/lib/catalog";
import { getCatalogSummary, getSubjectDetail, type SetInfo } from "@/lib/data";
import { formatINR, SETS_PER_SUBJECT, site } from "@/lib/site";
import { getUser } from "@/lib/supabase/server";

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ level: s.classLevel, subject: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ level: string; subject: string }> }): Promise<Metadata> {
  const { level, subject } = await params;
  const s = findSubject(level, subject);
  if (!s) return { title: "Subject" };
  return {
    title: `Class ${level} ${s.name} (${s.code}) Practice Papers ${site.session}`,
    description: `${SETS_PER_SUBJECT} CBSE Class ${level} ${s.name} practice papers for ${site.session} on the official sample paper pattern — Word + PDF with complete answer keys and marking schemes.`,
  };
}

export default async function SubjectPage({ params }: { params: Promise<{ level: string; subject: string }> }) {
  const { level, subject: slug } = await params;
  const subject = findSubject(level, slug);
  if (!subject) notFound();
  const user = await getUser();
  const [detail, summary] = await Promise.all([getSubjectDetail(subject, user?.id ?? null), getCatalogSummary()]);
  const available = detail.sets.filter((s) => s.published).length;
  const ownedCount = detail.sets.filter((s) => s.owned).length;
  const path = `/classes/${level}/${slug}`;
  const hindi = subject.language === "hi" ? "font-[family-name:var(--font-hindi)]" : "";
  const setPrice = Math.min(...detail.sets.map((s) => s.pricePaise));
  const separately = detail.sets.reduce((n, s) => n + s.pricePaise, 0);
  const save = bundleSaving(setPrice, detail.bundlePricePaise);
  const related = subjectsFor(subject.classLevel)
    .filter((s) => s.id !== subject.id)
    .sort((a, b) => Number(b.stream === subject.stream) - Number(a.stream === subject.stream))
    .slice(0, 4);

  const facts: [IconName, string, string][] = [
    ["layers", `${SETS_PER_SUBJECT} sets`, "Full-length papers"],
    ["clock", `${subject.hours} hours`, "Per paper"],
    ["target", `${subject.marks} marks`, "Theory paper"],
    ["file", "Word + PDF", "With answer key"],
  ];

  const faqs = [
    {
      q: `Which syllabus do these ${subject.name} papers follow?`,
      a: `Only the CBSE ${site.session} curriculum for Class ${level} ${subject.name} (${subject.code}). Each paper follows the structure of the latest CBSE Sample Question Paper — same sections, marks and question types.`,
    },
    {
      q: "What is the difference between buying a set and the bundle?",
      a: `A set gives you one full practice paper. The bundle gives you all ${SETS_PER_SUBJECT} sets of ${subject.name}, including any sets added later, for ${formatINR(detail.bundlePricePaise)} — much less than buying them one at a time.`,
    },
    {
      q: "How will I receive the files?",
      a: "Right after payment the files unlock in “My papers”. You can download the Word file and the PDF (question paper + answer key) as often as you like.",
    },
  ];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Class ${level} ${subject.name} (${subject.code}) Practice Papers ${site.session} — ${SETS_PER_SUBJECT} Sets`,
    description: `${SETS_PER_SUBJECT} CBSE practice papers with answer keys and marking schemes.`,
    brand: { "@type": "Brand", name: site.name },
    category: "Educational digital download",
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (detail.bundlePricePaise / 100).toFixed(2),
      availability: available > 0 ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      url: `${site.url}${path}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />

      {/* ---------------- product hero ---------------- */}
      <section className="border-b border-line bg-gradient-to-b from-white to-paper">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6">
          <nav className="text-sm text-muted">
            <Link href="/" className="hover:text-ink">
              Home
            </Link>{" "}
            /{" "}
            <Link href={`/classes/${level}`} className="hover:text-ink">
              Class {level}
            </Link>{" "}
            / <span className="text-ink">{subject.name}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-[200px_1fr_320px] lg:items-start xl:grid-cols-[250px_1fr_340px]">
            <div className="mx-auto w-[200px] sm:w-[240px] lg:w-full">
              <SubjectCover subject={subject} />
            </div>

            <div>
              <p className="eyebrow">
                Class {classRoman(subject.classLevel)} · Subject code {subject.code} · Session {site.session}
              </p>
              <h1 className={`font-display balance mt-2 text-3xl font-semibold leading-tight sm:text-[2.5rem] lg:text-[2.2rem] xl:text-[2.6rem] ${hindi}`}>
                {subject.name} Practice Papers
              </h1>
              <p className={`mt-4 max-w-xl leading-relaxed text-ink-soft ${hindi}`}>{subject.blurb}</p>
              <dl className="mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {facts.map(([icon, v, l]) => (
                  <div key={v} className="rounded-xl border border-line bg-white p-3">
                    <Icon name={icon} className="h-4.5 w-4.5 text-gold" />
                    <dt className="mt-2 text-sm font-semibold">{v}</dt>
                    <dd className="text-xs text-muted">{l}</dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-6 space-y-2 text-sm text-ink-soft">
                {[
                  `Strictly on the CBSE ${site.session} syllabus and sample paper pattern`,
                  "Fresh, original questions — never copied from sample papers",
                  "Complete answer key with value points and step marks",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Icon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* buy box */}
            <aside className="card p-6 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Complete subject bundle</p>
                {save > 0 && !detail.ownsBundle && <span className="chip bg-gold-soft text-gold">Save {save}%</span>}
              </div>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold">{formatINR(detail.bundlePricePaise)}</span>
                {separately > detail.bundlePricePaise && <span className="text-base text-muted line-through">{formatINR(separately)}</span>}
              </p>
              <p className="mt-1 text-xs text-muted">Inclusive of all taxes · one-time payment</p>
              <Availability ready={available} />
              <ul className="space-y-2 text-sm">
                {[
                  `All ${SETS_PER_SUBJECT} sets of ${subject.name}`,
                  "Word file + PDF with answer key for each",
                  "Sets added later included free",
                  "Lifetime access in My papers",
                ].map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <Icon name="check" className="h-4 w-4 shrink-0 text-teal" /> {p}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {detail.ownsBundle ? (
                  <Link href="/account" className="btn btn-outline w-full">
                    <Icon name="checkCircle" className="h-4 w-4 text-teal" /> You own this bundle — My papers
                  </Link>
                ) : detail.live && detail.bundleOnSale && available > 0 ? (
                  <BuyButton
                    type="subject"
                    subjectId={subject.id}
                    label={`Buy all ${SETS_PER_SUBJECT} sets · ${formatINR(detail.bundlePricePaise)}`}
                    className="btn btn-gold btn-lg w-full"
                    signedIn={!!user}
                    returnTo={path}
                  />
                ) : (
                  <button className="btn btn-outline w-full" disabled>
                    Bundle available soon
                  </button>
                )}
              </div>
              <a href="#sets" className="mt-3 block text-center text-sm font-semibold text-ink-soft hover:text-gold">
                Or buy single sets from {formatINR(setPrice)} ↓
              </a>
              <div className="mt-5 space-y-2 border-t border-line pt-4 text-xs text-muted">
                <p className="flex items-center gap-2">
                  <Icon name="bolt" className="h-4 w-4 text-gold" /> Instant download after payment
                </p>
                <p className="flex items-center gap-2">
                  <Icon name="refresh" className="h-4 w-4 text-gold" />
                  <span>
                    Covered by our{" "}
                    <Link href="/refund-policy" className="underline underline-offset-2 hover:text-ink">
                      refund policy
                    </Link>
                  </span>
                </p>
              </div>
              <PaymentMethods className="mt-4 [&_li]:text-[10px]" />
            </aside>
          </div>
        </div>
      </section>

      {/* ---------------- sets ---------------- */}
      <section id="sets" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle
            kicker={available > 0 ? `${available} of ${SETS_PER_SUBJECT} sets available` : "Sets are being prepared"}
            title="Choose individual sets"
            text="Each set includes the question paper (Word) and the question paper with its answer key (PDF)."
          />
          {ownedCount > 0 && (
            <Link href="/account" className="btn btn-outline">
              <Icon name="download" className="h-4 w-4" /> You own {ownedCount} {ownedCount === 1 ? "set" : "sets"}
            </Link>
          )}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {detail.sets.map((set) => (
            <SetCard key={set.setNo} set={set} signedIn={!!user} returnTo={path} />
          ))}
        </div>
      </section>

      {/* ---------------- look inside ---------------- */}
      <section className="mt-20 border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <PaperPreview subject={subject} />
          <div>
            <SectionTitle
              kicker="What a set looks like"
              title={`Board-style ${subject.name} papers, fully solved`}
              text={`Every ${subject.name} set has the same layout as the CBSE ${site.session} sample paper: general instructions, section-wise questions with internal choices, and a ${subject.marks}-mark, ${subject.hours}-hour paper.`}
            />
            <ul className="mt-6 space-y-3">
              {FILE_KINDS.filter((k) => !("optional" in k)).map((k) => (
                <li key={k.kind} className="flex items-center gap-4 rounded-xl border border-line bg-paper p-4">
                  <FileBadge kind={k.kind} />
                  <div>
                    <p className="font-semibold">{k.label}</p>
                    <p className="text-sm text-muted">
                      {k.kind === "docx" ? "Editable Word file — print it or adapt it for tests" : "Print-ready PDF with the complete marking scheme"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- faq + related ---------------- */}
      <section className="mx-auto max-w-3xl px-4 pt-20 sm:px-6">
        <SectionTitle kicker="Good to know" title={`About these ${subject.name} papers`} center />
        <div className="mt-8">
          <Faq items={faqs} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle kicker={`More for Class ${level}`} title="Students also prepare with" />
          <Link href={`/classes/${level}`} className="btn btn-outline">
            All Class {level} subjects <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((s) => (
            <ProductCard key={s.id} subject={s} summary={summary[s.id]} />
          ))}
        </div>
      </section>
    </>
  );
}

function SetCard({ set, signedIn, returnTo }: { set: SetInfo; signedIn: boolean; returnTo: string }) {
  const kinds = FILE_KINDS.filter((k) => !("optional" in k) || set.files.includes(k.kind));
  return (
    <article
      className={`card flex flex-col p-5 ${set.owned ? "ring-2 ring-teal/40" : ""} ${!set.published && !set.owned ? "!bg-white/70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`font-display grid h-11 w-11 place-items-center rounded-xl text-lg font-semibold ${
              set.owned ? "bg-teal-soft text-teal" : set.published ? "bg-ink text-white" : "bg-paper-deep text-muted"
            }`}
          >
            {set.setNo}
          </span>
          <div>
            <h3 className="font-semibold">{set.title}</h3>
            <p className="text-xs text-muted">Full-length practice paper</p>
          </div>
        </div>
        {set.owned ? (
          <span className="chip bg-teal-soft text-teal">Owned</span>
        ) : set.published ? (
          <span className="font-display text-xl font-semibold">{formatINR(set.pricePaise)}</span>
        ) : (
          <span className="chip bg-paper-deep text-muted">Coming soon</span>
        )}
      </div>
      <ul className="mt-4 flex-1 space-y-2">
        {kinds.map((k) => {
          const has = set.files.includes(k.kind);
          return (
            <li key={k.kind} className="flex items-center gap-3">
              <FileBadge kind={k.kind} small />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{k.label}</p>
                <p className="truncate text-xs text-muted">
                  {has ? `${set.title}.${k.kind === "docx" ? "docx" : "pdf"}` : `${k.format}${set.published ? "" : " · being prepared"}`}
                </p>
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
          <Link href="/account" className="btn btn-outline w-full text-sm">
            Open in My papers
          </Link>
        ) : set.published && set.paperId ? (
          <BuyButton
            type="paper"
            paperId={set.paperId}
            label={`Buy set ${set.setNo} · ${formatINR(set.pricePaise)}`}
            className="btn btn-primary w-full text-sm"
            signedIn={signedIn}
            returnTo={returnTo}
          />
        ) : (
          <button className="btn btn-outline w-full text-sm" disabled>
            Coming soon
          </button>
        )}
      </div>
    </article>
  );
}
