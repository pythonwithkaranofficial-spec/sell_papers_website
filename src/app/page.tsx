import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { PaperPreview } from "@/components/PaperPreview";
import { ProductCard, bundleSaving } from "@/components/ProductCard";
import { SubjectCover } from "@/components/SubjectCover";
import { Faq, PaymentMethods, SectionTitle, TrustBar } from "@/components/Trust";
import { CLASSES, PRODUCT_LINES, SUBJECTS, subjectById, subjectsFor } from "@/lib/catalog";
import { getCatalogSummary } from "@/lib/data";
import { formatINR, SETS_PER_SUBJECT, site } from "@/lib/site";

// Rebuilt at most once a minute and served from the cache in between, so it opens instantly.
export const revalidate = 60;

const faqs = [
  {
    q: "What exactly do I get when I buy a set?",
    a: "Each set gives you two files: the question paper as an editable Word file (.docx), and a print-ready PDF that contains the same question paper followed by its complete answer key and marking scheme.",
  },
  {
    q: "Are these official CBSE papers?",
    a: `No. They are independent practice papers written on the pattern of the official CBSE Sample Question Papers ${site.session}, using only the ${site.session} curriculum. They are not affiliated with or endorsed by CBSE.`,
  },
  {
    q: "Are the questions copied from sample papers or old board papers?",
    a: "No. Every question is written fresh. We study several sessions of official sample papers to match the pattern, marks and question types — but we never copy or lightly reword their questions.",
  },
  {
    q: "How do I download after paying?",
    a: "Create a free account, pay securely by UPI, card, net banking or wallet, and the files unlock instantly under “My papers”. You can download them again any time.",
  },
  {
    q: "Can I buy all the papers of a subject together?",
    a: `Yes. Every subject has a bundle of all ${SETS_PER_SUBJECT} sets that costs much less than buying the sets one by one. Sets added to a subject later are included in the bundle automatically.`,
  },
  {
    q: "Can teachers and coaching institutes use these papers?",
    a: "Yes — the Word file is fully editable, so teachers can print them for class tests or adapt the layout. Please don't resell or redistribute the files.",
  },
  {
    q: "Is my payment safe? What if something goes wrong?",
    a: "Payments are processed by an RBI-authorised payment gateway; we never see your card or UPI details. If you are charged and your papers don't appear, or a file is unreadable and we can't replace it, you get a refund as per our refund policy.",
  },
];

const audiences: { icon: IconName; title: string; text: string; points: string[] }[] = [
  {
    icon: "cap",
    title: "Students",
    text: "Practise under real exam conditions and check every answer against the marking scheme.",
    points: ["Timed, full-length papers", "Know where step marks are lost", "30 different sets per subject"],
  },
  {
    icon: "board",
    title: "Teachers & tutors",
    text: "Ready-made, syllabus-accurate papers for class tests, pre-boards and revision.",
    points: ["Editable Word files", "Print-ready PDFs", "Answer keys for quick checking"],
  },
  {
    icon: "heart",
    title: "Parents",
    text: "Give your child board-level practice without hunting through unreliable sources.",
    points: ["Current 2026-27 syllabus only", "Instant, secure purchase", "One-time payment, lifetime access"],
  },
];

const process: { icon: IconName; title: string; text: string }[] = [
  { icon: "book", title: "Study the official pattern", text: "We analyse five sessions of CBSE Sample Question Papers and marking schemes for every subject." },
  { icon: "target", title: "Map the 2026-27 syllabus", text: "Each paper is planned chapter by chapter against the current CBSE curriculum — nothing deleted or outdated." },
  { icon: "pencil", title: "Write fresh questions", text: "Original questions in every CBSE format: MCQ, assertion–reason, case-based, source-based and long answer." },
  { icon: "clipboard", title: "Check every set", text: "Marks totals, section structure, internal choices, syllabus coverage and originality are verified before release." },
  { icon: "checkCircle", title: "Solve it completely", text: "A full answer key with value points and step marks, the way board examiners evaluate." },
];

const guarantees: { icon: IconName; title: string; text: string; href: string }[] = [
  { icon: "bolt", title: "Delivered instantly", text: "Your files unlock as soon as payment succeeds. If they don't appear within 15 minutes, we fix it.", href: "/delivery-policy" },
  { icon: "refresh", title: "Fair refund policy", text: "Charged twice, papers not delivered, or a file we can't replace? You get your money back.", href: "/refund-policy" },
  { icon: "lock", title: "Private & secure", text: "Secure, RBI-authorised payment gateway. Your files are stored privately and only you can download them.", href: "/privacy" },
  { icon: "headset", title: "Real human support", text: "Questions about a paper or a payment? Write to us — we usually reply within one working day.", href: "/contact" },
];

export default async function Home() {
  const summary = await getCatalogSummary();
  const totalAvailable = Object.values(summary).reduce((n, s) => n + s.available, 0);
  const setFrom = Math.min(...Object.values(summary).map((s) => s.setPricePaise));
  const bundleFrom = Math.min(...Object.values(summary).map((s) => s.bundlePricePaise));
  const save = bundleSaving(setFrom, bundleFrom);

  // Subjects with the most sets ready first; catalogue order breaks ties.
  const featured = [...SUBJECTS]
    .map((s, i) => ({ s, i }))
    .sort((a, b) => summary[b.s.id].available - summary[a.s.id].available || a.i - b.i)
    .slice(0, 8)
    .map((x) => x.s);

  const heroCovers = ["class-12-physics", "class-10-science", "class-12-accountancy"].map((id) => subjectById(id)!);

  return (
    <>
      {/* ---------------- hero ---------------- */}
      <section className="hero-light relative overflow-hidden border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 md:pb-24 md:pt-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="chip border border-[#bcd0f5] bg-lime/50 py-1 text-teal">
              <Icon name="sparkles" className="h-3.5 w-3.5" /> CBSE Session {site.session} · Board Exams 2027
            </span>
            <h1 className="font-display balance mt-6 text-4xl leading-[1.04] sm:text-5xl lg:text-[3.7rem]">
              Board exam practice papers, made the way <span className="text-gold">CBSE sets them</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Full-length practice sets for Class 10 and Class 12 — {SETS_PER_SUBJECT} per subject, each with an editable Word paper and a
              print-ready PDF with the complete answer key and marking scheme.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/classes/10" className="btn btn-primary btn-lg">
                Shop Class 10 papers <Icon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link href="/classes/12" className="btn btn-outline btn-lg">
                Shop Class 12 papers
              </Link>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
              {[
                ["lock", "Secure UPI & card checkout"],
                ["bolt", "Instant download"],
                ["checkCircle", "Answer keys included"],
              ].map(([icon, label]) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon name={icon as IconName} className="h-4 w-4 text-gold" /> {label}
                </li>
              ))}
            </ul>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-8">
              {[
                [String(SUBJECTS.length), "subjects"],
                [String(SETS_PER_SUBJECT), "sets per subject"],
                totalAvailable > 0 ? [String(totalAvailable), "sets ready now"] : ["2", "classes"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-3xl sm:text-4xl">{v}</dt>
                  <dd className="mt-1 text-sm text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* fanned product covers */}
          <div className="relative mx-auto hidden h-[440px] w-full max-w-[440px] sm:block" aria-hidden="true">
            <div className="absolute left-[4%] top-[12%] w-[44%] -rotate-[9deg]">
              <SubjectCover subject={heroCovers[1]} />
            </div>
            <div className="absolute right-[2%] top-[10%] w-[44%] rotate-[8deg]">
              <SubjectCover subject={heroCovers[2]} />
            </div>
            <div className="absolute left-1/2 top-0 w-[50%] -translate-x-1/2">
              <SubjectCover subject={heroCovers[0]} />
            </div>
            <div className="card absolute bottom-2 left-0 flex items-center gap-3 p-3 pr-5 text-ink !shadow-xl">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#b3261e] text-[11px] font-bold text-white">PDF</span>
              <div>
                <p className="text-sm font-semibold">Question paper + answer key</p>
                <p className="text-xs text-muted">Print-ready · step marking</p>
              </div>
            </div>
            <div className="card absolute bottom-16 right-0 flex items-center gap-3 p-3 pr-5 text-ink !shadow-xl">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2b579a] text-sm font-bold text-white">W</span>
              <div>
                <p className="text-sm font-semibold">Editable Word file</p>
                <p className="text-xs text-muted">Print or customise</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustBar className="!border-t-0" />

      {/* ---------------- what we sell ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <SectionTitle
          kicker="Our study store"
          title="Exam-ready digital resources, delivered instantly"
          text="Everything here is a digital download — buy once, keep it forever in your library. Board practice paper sets are available now, with more resources on the way."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PRODUCT_LINES.map((p) => {
            const live = p.status === "live";
            const body = (
              <>
                <div className="flex items-center justify-between">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${live ? "bg-ink text-gold-bright" : "bg-paper-deep text-muted"}`}>
                    <Icon name={p.key === "practice-papers" ? "file" : p.key === "question-banks" ? "layers" : "sparkles"} className="h-6 w-6" />
                  </span>
                  <span className={`chip ${live ? "bg-teal-soft text-teal" : "bg-paper-deep text-muted"}`}>{live ? "Available now" : "Coming soon"}</span>
                </div>
                <h3 className="font-display mt-5 text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.text}</p>
                <ul className="mt-5 space-y-1.5 text-sm">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2 text-ink-soft">
                      <Icon name="check" className={`h-4 w-4 ${live ? "text-teal" : "text-muted"}`} /> {pt}
                    </li>
                  ))}
                </ul>
                {live && (
                  <p className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-ink group-hover:text-gold">
                    Browse papers <Icon name="arrowRight" className="h-4 w-4" />
                  </p>
                )}
              </>
            );
            return live && p.href ? (
              <Link key={p.key} href={p.href} className="card card-hover group flex flex-col !border-gold/40 p-7 ring-1 ring-gold/20">
                {body}
              </Link>
            ) : (
              <div key={p.key} className="card flex flex-col !bg-white/60 p-7">
                {body}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- shop by class ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <SectionTitle kicker="Shop by class" title="Choose your class to see every subject" />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {CLASSES.map((c) => {
            const subs = subjectsFor(c.level);
            const ready = subs.reduce((n, s) => n + summary[s.id].available, 0);
            return (
              <Link
                key={c.level}
                href={`/classes/${c.level}`}
                className={`${c.level === "10" ? "tint-green" : "tint-blue"} card-hover group relative block overflow-hidden rounded-3xl border border-line p-8`}
              >
                <p className="text-sm font-semibold text-gold">{c.subtitle}</p>
                <h3 className="font-display mt-1 text-4xl">{c.title}</h3>
                <p className="mt-2 text-sm text-muted">
                  {subs.length} subjects · {subs.length * SETS_PER_SUBJECT} practice sets
                  {ready > 0 ? ` · ${ready} ready to download` : ""}
                </p>
                <div className="mt-7 flex gap-3">
                  {subs.slice(0, 5).map((s) => (
                    <div key={s.id} className="w-[18%] max-w-[92px] transition duration-300 group-hover:-translate-y-1">
                      <SubjectCover subject={s} />
                    </div>
                  ))}
                </div>
                <ul className="mt-6 flex flex-wrap gap-1.5">
                  {subs.map((s) => (
                    <li key={s.id} className="rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-xs text-ink-soft">
                      {s.name}
                    </li>
                  ))}
                </ul>
                <p className="mt-7 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white transition group-hover:bg-gold">
                  Shop {c.title} papers <Icon name="arrowRight" className="h-4 w-4" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------------- featured products ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle
            kicker={totalAvailable > 0 ? "Ready to download" : "Popular subjects"}
            title={totalAvailable > 0 ? "Subjects you can start practising today" : "Most-wanted practice paper bundles"}
          />
          <Link href="/papers" className="btn btn-outline">
            View all {SUBJECTS.length} subjects <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((s) => (
            <ProductCard key={s.id} subject={s} summary={summary[s.id]} />
          ))}
        </div>
      </section>

      {/* ---------------- look inside ---------------- */}
      <section id="inside" className="mt-24 scroll-mt-20 border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <PaperPreview subject={subjectById("class-12-physics")!} />
          <div>
            <SectionTitle
              kicker="Look inside a set"
              title="Exactly like the board paper — with the answers"
              text="Every set follows the section-wise structure of the latest CBSE Sample Question Paper for its subject, so practice feels like the real exam."
            />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["file", "Official structure", "Sections, marks, time and internal choices as per the 2026-27 SQP."],
                ["clipboard", "General instructions", "The same instructions students will read in the exam hall."],
                ["layers", "Every question type", "MCQ, assertion–reason, case-based, source-based and long answers."],
                ["checkCircle", "Complete answer key", "Value points and step marks for every question."],
                ["pencil", "Editable Word file", "Teachers can print it or adapt it for class tests."],
                ["printer", "Print-ready PDF", "Question paper followed by its marking scheme."],
              ].map(([icon, t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-soft text-teal">
                    <Icon name={icon as IconName} className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- audiences ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <SectionTitle kicker="Made for" title="Built for everyone preparing for the boards" center />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {audiences.map((a) => (
            <div key={a.title} className="card p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-soft text-gold">
                <Icon name={a.icon} className="h-6 w-6" />
              </span>
              <h3 className="font-display mt-5 text-xl font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{a.text}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {a.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-ink-soft">
                    <Icon name="check" className="h-4 w-4 text-teal" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- quality process ---------------- */}
      <section className="mt-24 hero-dark text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionTitle
            dark
            kicker="Our quality promise"
            title="How every paper is made"
            text="No recycled questions, no outdated chapters. Each set goes through the same five-step process before it reaches the store."
          />
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {process.map((p, i) => (
              <li key={p.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-bright/15 text-gold-bright">
                    <Icon name={p.icon} />
                  </span>
                  <span className="font-display text-3xl font-semibold text-white/15">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- pricing ---------------- */}
      <section id="pricing" className="mx-auto max-w-5xl scroll-mt-20 px-4 pt-24 sm:px-6">
        <SectionTitle
          kicker="Simple, honest pricing"
          title="Pay once. Keep it forever."
          text="No subscriptions and no hidden charges. Prices include all taxes."
          center
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="card flex flex-col p-8">
            <p className="text-sm font-semibold text-muted">Single set</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-sm text-muted">from</span>
              <span className="font-display text-5xl font-semibold">{formatINR(setFrom)}</span>
            </p>
            <p className="mt-2 text-sm text-muted">One full practice paper — perfect for a mock test this weekend.</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {["Question paper (Word, editable)", "Question paper + answer key (PDF)", "Step-wise marking scheme", "Lifetime downloads"].map((p) => (
                <li key={p} className="flex items-center gap-2.5">
                  <Icon name="check" className="h-4 w-4 text-teal" /> {p}
                </li>
              ))}
            </ul>
            <Link href="/papers" className="btn btn-outline mt-8 w-full">
              Choose a set
            </Link>
          </div>
          <div className="card relative flex flex-col overflow-hidden !border-gold p-8 ring-2 ring-gold/40">
            <span className="chip absolute right-5 top-5 bg-gold text-white">Best value{save > 0 ? ` · save ${save}%` : ""}</span>
            <p className="text-sm font-semibold text-muted">Subject bundle · all {SETS_PER_SUBJECT} sets</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-sm text-muted">from</span>
              <span className="font-display text-5xl font-semibold">{formatINR(bundleFrom)}</span>
              {save > 0 && <span className="text-lg text-muted line-through">{formatINR(setFrom * SETS_PER_SUBJECT)}</span>}
            </p>
            <p className="mt-2 text-sm text-muted">
              Complete preparation for one subject — about {formatINR(Math.round(bundleFrom / SETS_PER_SUBJECT / 100) * 100)} per paper.
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {[
                `All ${SETS_PER_SUBJECT} sets of the subject`,
                "Word + PDF + answer key for every set",
                "Sets added later included free",
                "Lifetime downloads",
              ].map((p) => (
                <li key={p} className="flex items-center gap-2.5">
                  <Icon name="check" className="h-4 w-4 text-gold" /> {p}
                </li>
              ))}
            </ul>
            <Link href="/papers" className="btn btn-gold mt-8 w-full">
              Choose a subject bundle
            </Link>
          </div>
        </div>
        <PaymentMethods className="mt-8 flex flex-col items-center text-center [&_ul]:justify-center" />
      </section>

      {/* ---------------- how it works ---------------- */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24 sm:px-6">
        <SectionTitle kicker="How it works" title="Your papers in under two minutes" center />
        <ol className="relative mt-12 grid gap-6 md:grid-cols-4">
          {[
            ["search", "Find your subject", "Pick your class and subject and browse its sets."],
            ["user", "Create a free account", "Sign up with your email — it keeps your purchases safe."],
            ["lock", "Pay securely", "UPI, cards, net banking or wallets — secure checkout."],
            ["download", "Download instantly", "Get the Word file and PDF with answer key in My papers."],
          ].map(([icon, t, d], i) => (
            <li key={t} className="card relative p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-semibold text-white">{i + 1}</span>
                <Icon name={icon as IconName} className="h-5 w-5 text-gold" />
              </div>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------- guarantees ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="rounded-3xl border border-line bg-paper-deep p-8 sm:p-12">
          <SectionTitle kicker="Buy with confidence" title="Our promise to every customer" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {guarantees.map((g) => (
              <Link key={g.title} href={g.href} className="card card-hover group flex flex-col p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-soft text-teal">
                  <Icon name={g.icon} />
                </span>
                <h3 className="mt-4 font-semibold">{g.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{g.text}</p>
                <p className="mt-4 text-xs font-semibold text-ink-soft group-hover:text-gold">Read the policy →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- faq ---------------- */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pt-24 sm:px-6">
        <SectionTitle kicker="Questions" title="Frequently asked questions" center />
        <div className="mt-10">
          <Faq items={faqs} />
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Still have a question?{" "}
          <Link href="/contact" className="font-semibold text-ink underline decoration-gold underline-offset-4">
            Contact us
          </Link>
        </p>
      </section>

      {/* ---------------- final CTA ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="hero-dark relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white sm:px-14">
          <h2 className="font-display balance mx-auto max-w-2xl text-3xl font-semibold sm:text-4xl">
            Start practising with board-level papers today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Pick your class, choose a subject and download your first set in minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/classes/10" className="btn btn-lime btn-lg">
              Class 10 papers
            </Link>
            <Link href="/classes/12" className="btn btn-ghost-light btn-lg">
              Class 12 papers
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
