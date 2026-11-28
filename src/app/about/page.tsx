import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { SubjectCover } from "@/components/SubjectCover";
import { SUBJECTS, subjectById } from "@/lib/catalog";
import { SETS_PER_SUBJECT, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: `About ${site.name}: original CBSE ${site.session} practice papers for Class 10 and Class 12, sold as instant digital downloads.`,
};

const values: [IconName, string, string][] = [
  ["target", "Only the current syllabus", `Every question comes from the CBSE ${site.session} curriculum — nothing from deleted or older chapters.`],
  ["pencil", "Original questions", "We write every question fresh. We study the official sample papers for the pattern, but never copy them."],
  ["clipboard", "Checked before release", "Marks, sections, internal choices, syllabus coverage and originality are checked for every set."],
  ["checkCircle", "Complete answers", "Each set comes with a full answer key and step-wise marking scheme, the way examiners mark."],
];

export default function AboutPage() {
  const covers = ["class-10-science", "class-12-physics", "class-12-accountancy"].map((id) => subjectById(id)!);
  return (
    <>
      <section className="hero-light border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="eyebrow">About us</p>
            <h1 className="font-display balance mt-3 text-4xl leading-[1.08] sm:text-5xl">
              Board exam practice papers, written with care for <span className="text-gold">CBSE students and teachers</span>.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {site.name} is an independent online store run by {site.businessName}. We create and sell original practice papers for
              CBSE Class 10 and Class 12 (session {site.session}) as instant digital downloads.
            </p>
          </div>
          <div className="relative mx-auto hidden h-60 w-80 sm:block" aria-hidden="true">
            <div className="absolute left-0 top-6 w-28 -rotate-[9deg]">
              <SubjectCover subject={covers[0]} />
            </div>
            <div className="absolute right-0 top-6 w-28 rotate-[8deg]">
              <SubjectCover subject={covers[2]} />
            </div>
            <div className="absolute left-1/2 top-0 w-32 -translate-x-1/2">
              <SubjectCover subject={covers[1]} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl">What we do</h2>
            <div className="mt-4 space-y-4 leading-relaxed text-ink-soft">
              <p>
                Students learn best by practising on papers that look and feel like the real board exam. We prepare full-length practice
                papers for {SUBJECTS.length} CBSE subjects — {SETS_PER_SUBJECT} different sets for each subject — following the structure of
                the official CBSE Sample Question Papers: the same sections, marks, time, question types and internal choices.
              </p>
              <p>
                Every set has two files: the question paper as an editable Word file (useful for teachers who want to print or adapt it),
                and a print-ready PDF with the question paper followed by its complete answer key and marking scheme.
              </p>
              <p>
                Papers are sold individually or as a subject bundle. After a secure online payment, they are available immediately in the
                buyer&apos;s <Link href="/account" className="font-medium text-ink underline underline-offset-4">My papers</Link> page and can be
                downloaded again at any time.
              </p>
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl">Who it is for</h2>
            <ul className="mt-4 space-y-3">
              {[
                ["cap", "Students", "preparing for the Class 10 and Class 12 board exams"],
                ["board", "Teachers and tutors", "who need ready, syllabus-accurate papers for tests and revision"],
                ["heart", "Parents", "looking for reliable practice material for their children"],
              ].map(([icon, title, text]) => (
                <li key={title} className="card flex items-start gap-4 p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold">
                    <Icon name={icon as IconName} />
                  </span>
                  <p className="text-ink-soft">
                    <strong className="font-semibold text-ink">{title}</strong> {text}.
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <h2 className="font-display text-3xl">How we make every paper</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(([icon, title, text]) => (
            <div key={title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-soft text-teal">
                <Icon name={icon} />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm text-muted">
          {site.name} is not affiliated with or endorsed by the Central Board of Secondary Education (CBSE). Our papers are independent
          practice material prepared on the pattern of the CBSE Sample Question Papers {site.session}.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="tint-green grid gap-6 rounded-3xl border border-line p-8 sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="font-display text-3xl">Get in touch</h2>
            <dl className="mt-4 grid gap-2 text-sm text-ink-soft sm:grid-cols-[110px_1fr]">
              <dt className="font-semibold text-ink">Business</dt>
              <dd>{site.businessName}</dd>
              <dt className="font-semibold text-ink">Address</dt>
              <dd>{site.businessAddress}</dd>
              <dt className="font-semibold text-ink">Email</dt>
              <dd>
                <a href={`mailto:${site.supportEmail}`} className="underline underline-offset-4">
                  {site.supportEmail}
                </a>
              </dd>
              <dt className="font-semibold text-ink">Phone</dt>
              <dd>
                <a href={`tel:${site.supportPhone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">
                  {site.supportPhone}
                </a>
              </dd>
            </dl>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/papers" className="btn btn-primary">
              Browse papers
            </Link>
            <Link href="/contact" className="btn btn-outline">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
