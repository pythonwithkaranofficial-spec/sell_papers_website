import { classRoman, streamColor, type Subject } from "@/lib/catalog";
import { SETS_PER_SUBJECT, site } from "@/lib/site";

/** Booklet-style product cover for a subject. Scales with its width (container query units). */
export function SubjectCover({ subject, className = "" }: { subject: Subject; className?: string }) {
  const long = subject.name.length > 20;
  return (
    <div className={`cover ${className}`} style={{ backgroundColor: streamColor(subject.stream) }} aria-hidden="true">
      <span
        className="font-display pointer-events-none absolute -right-[3cqw] bottom-[22cqw] font-semibold leading-none text-white/[0.07]"
        style={{ fontSize: "44cqw" }}
      >
        {subject.code}
      </span>
      <div className="relative flex h-full flex-col pb-[8cqw] pl-[13cqw] pr-[8cqw] pt-[9cqw]">
        <div className="flex items-center justify-between font-bold uppercase" style={{ fontSize: "4.4cqw", letterSpacing: "0.14em" }}>
          <span className="text-gold-bright">CBSE · Class {classRoman(subject.classLevel)}</span>
          <span className="text-white/70">{site.session}</span>
        </div>
        <div className="mt-[3cqw] h-px bg-gold-bright/60" />
        <p className="mt-[9cqw] font-semibold uppercase text-white/75" style={{ fontSize: "4.2cqw", letterSpacing: "0.2em" }}>
          Board Practice Papers
        </p>
        <p className="font-display balance mt-[2.5cqw] font-semibold leading-[1.05]" style={{ fontSize: long ? "9.5cqw" : "11.5cqw" }}>
          {subject.name}
        </p>
        <p className="mt-[3cqw] text-white/70" style={{ fontSize: "4.6cqw" }}>
          Subject Code {subject.code}
        </p>
        <div className="mt-auto flex items-end justify-between gap-[3cqw]">
          <p className="leading-snug text-white/75" style={{ fontSize: "4.2cqw" }}>
            Question papers
            <br />
            Answer keys
            <br />
            Marking scheme
          </p>
          <div
            className="flex shrink-0 flex-col items-center justify-center rounded-full bg-gold-bright font-bold leading-none text-ink shadow-md"
            style={{ width: "24cqw", height: "24cqw" }}
          >
            <span className="font-display" style={{ fontSize: "9cqw" }}>
              {SETS_PER_SUBJECT}
            </span>
            <span style={{ fontSize: "3.6cqw", letterSpacing: "0.12em" }}>SETS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
