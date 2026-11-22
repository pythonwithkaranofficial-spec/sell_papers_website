import Link from "next/link";
import { FileBadge } from "@/components/FileBadge";
import { CLASSES, FILE_KINDS, SUBJECTS, subjectsFor } from "@/lib/catalog";
import { defaultPrices, formatINR, SETS_PER_SUBJECT, site } from "@/lib/site";

const features = [
  { title: "Official SQP pattern", text: "Every paper mirrors the CBSE 2026-27 Sample Question Paper: sections, marks, internal choices and general instructions." },
  { title: "2026-27 syllabus only", text: "Questions come strictly from the current CBSE curriculum — nothing from deleted or older syllabuses." },
  { title: "Five years of patterns", text: "Question styles are modelled on five sessions of official CBSE sample papers — fresh questions, never copies." },
  { title: "Complete answer keys", text: "Value-point marking schemes with step marks, exactly the way CBSE examiners evaluate." },
];

const faqs = [
  { q: "What do I get when I buy a set?", a: "Each set includes the question paper as an editable Word file and a print-ready PDF containing the question paper followed by its complete answer key and marking scheme." },
  { q: "Are these official CBSE papers?", a: `No. They are independent practice papers prepared on the pattern of the official CBSE Sample Question Papers ${site.session}, using only the ${site.session} curriculum.` },
  { q: "How do I download after paying?", a: "Sign in, pay securely through Razorpay (UPI, cards, net banking, wallets), and the set appears instantly under “My papers”, where you can download it any time." },
  { q: "Can I buy all papers of a subject together?", a: `Yes — every subject has a bundle of all ${SETS_PER_SUBJECT} sets at a lower price than buying them one by one.` },
  { q: "Is payment secure?", a: "Payments are processed by Razorpay, an RBI-authorised payment aggregator. We never see or store your card or UPI details." },
];

export default function Home() {
  return (
    <>
      {/* hero */}
      <section className="ruled relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:py-28">
          <div>
            <span className="chip bg-gold-soft text-gold">CBSE Session {site.session} · Board Exams 2027</span>
            <h1 className="font-display mt-5 text-4xl font-semibold leading-[1.08] sm:text-5xl md:text-6xl">
              Practice papers that feel like the <em className="text-gold not-italic">real board exam</em>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              {SETS_PER_SUBJECT} fully solved practice sets for every subject of Class 10 and Class 12 — built on the official
              CBSE pattern, with complete marking schemes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/classes/10" className="btn btn-primary">Browse Class 10</Link>
              <Link href="/classes/12" className="btn btn-gold">Browse Class 12</Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
              {[
                [String(SUBJECTS.length), "subjects"],
                [String(SETS_PER_SUBJECT), "sets per subject"],
                [String(SUBJECTS.length * SETS_PER_SUBJECT), "papers in total"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-3xl font-semibold">{v}</dt>
                  <dd className="text-sm text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <PaperStack />
        </div>
      </section>

      {/* classes */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionTitle kicker="Choose your class" title="Every subject. Thirty sets each." />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {CLASSES.map((c) => (
            <Link key={c.level} href={`/classes/${c.level}`} className="card group block p-7 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gold">{c.subtitle}</p>
                  <h3 className="font-display mt-1 text-3xl font-semibold">{c.title}</h3>
                </div>
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                  {subjectsFor(c.level).length} subjects
                </span>
              </div>
              <ul className="mt-6 flex flex-wrap gap-2">
                {subjectsFor(c.level).map((s) => (
                  <li key={s.id} className="chip border border-line bg-paper text-ink-soft">
                    <span aria-hidden>{s.icon}</span> {s.name}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm font-semibold text-ink group-hover:text-gold">View all {c.title} papers →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* features */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionTitle kicker="Why students choose us" title="Prepared the way examiners set papers" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={f.title} className="rounded-2xl border border-line bg-paper p-6">
                <span className="font-display text-2xl font-semibold text-gold">0{i + 1}</span>
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* what's in a set + pricing */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <SectionTitle kicker="Inside every set" title="Ready to practise, ready to print" />
            <ul className="mt-8 space-y-4">
              {FILE_KINDS.filter((k) => !("optional" in k)).map((k) => (
                <li key={k.kind} className="card flex items-center gap-4 p-5">
                  <FileBadge kind={k.kind} />
                  <div>
                    <p className="font-semibold">{k.label}</p>
                    <p className="text-sm text-muted">{k.format}</p>
                  </div>
                </li>
              ))}
              <li className="card flex items-center gap-4 p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-soft text-lg">✓</span>
                <div>
                  <p className="font-semibold">Instant, lifetime access</p>
                  <p className="text-sm text-muted">Download again any time from “My papers”.</p>
                </div>
              </li>
            </ul>
          </div>
          <div id="pricing">
            <SectionTitle kicker="Simple pricing" title="Pay only for what you need" />
            <div className="mt-8 grid gap-5">
              <div className="card p-6">
                <p className="text-sm font-semibold text-muted">Single set</p>
                <p className="font-display mt-1 text-4xl font-semibold">{formatINR(defaultPrices.setPaise)}</p>
                <p className="mt-2 text-sm text-muted">One full practice paper with Word file, PDF and answer key.</p>
              </div>
              <div className="card relative overflow-hidden border-gold p-6">
                <span className="chip absolute right-4 top-4 bg-gold text-white">Best value</span>
                <p className="text-sm font-semibold text-muted">Subject bundle · all {SETS_PER_SUBJECT} sets</p>
                <p className="font-display mt-1 text-4xl font-semibold">{formatINR(defaultPrices.subjectBundlePaise)}</p>
                <p className="mt-2 text-sm text-muted">
                  Every set of one subject — about {formatINR(Math.round(defaultPrices.subjectBundlePaise / SETS_PER_SUBJECT))} per paper.
                </p>
              </div>
              <p className="text-xs text-muted">Prices include all taxes. Secure payments by Razorpay — UPI, cards, net banking and wallets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how-it-works" className="border-y border-line bg-paper-deep">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionTitle kicker="How it works" title="Three steps to your papers" />
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ["Pick your subject", "Open your class, choose a subject and browse its 30 sets."],
              ["Pay securely", "Sign in with your email and pay through Razorpay in seconds."],
              ["Download & practise", "Get the Word file and the PDF with answer key instantly."],
            ].map(([t, d], i) => (
              <li key={t} className="card p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-semibold text-white">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <SectionTitle kicker="Questions" title="Frequently asked" center />
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="card group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                {f.q}
                <span className="text-gold transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function SectionTitle({ kicker, title, center }: { kicker: string; title: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">{kicker}</p>
      <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{title}</h2>
    </div>
  );
}

function PaperStack() {
  return (
    <div className="relative mx-auto hidden h-[420px] w-full max-w-sm md:block" aria-hidden>
      <div className="card absolute left-10 top-10 h-[360px] w-[270px] rotate-6 bg-paper-deep" />
      <div className="card absolute left-4 top-5 h-[360px] w-[270px] -rotate-3" />
      <div className="card absolute left-0 top-0 h-[370px] w-[280px] p-6">
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted">Practice Paper · Set 7</p>
        <p className="font-display mt-1 text-center text-lg font-semibold">PHYSICS (042)</p>
        <p className="text-center text-[11px] text-muted">Class XII · Session 2026-27</p>
        <div className="mt-3 flex justify-between border-y border-line py-1.5 text-[10px] font-semibold">
          <span>Max. Marks: 70</span>
          <span>Time: 3 hours</span>
        </div>
        <p className="mt-3 text-center text-[10px] font-bold">SECTION A</p>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="mt-2.5 flex gap-2 text-[10px]">
            <span className="font-semibold">{n}.</span>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 rounded bg-ink/15" style={{ width: `${92 - n * 6}%` }} />
              <div className="h-1.5 w-3/5 rounded bg-ink/10" />
            </div>
            <span className="text-muted">1</span>
          </div>
        ))}
        <div className="mt-5 rounded-lg bg-gold-soft p-2.5 text-[10px] font-semibold text-gold">✓ Answer key with step marking included</div>
      </div>
    </div>
  );
}
