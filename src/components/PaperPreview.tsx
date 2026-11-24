import { classRoman, type Subject } from "@/lib/catalog";
import { site } from "@/lib/site";
import { Icon } from "./Icon";

function Bars({ widths }: { widths: number[] }) {
  return (
    <div className="flex-1 space-y-1 pt-1">
      {widths.map((w, i) => (
        <div key={i} className="h-1.5 rounded bg-ink/12" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

/** Illustration of what a set looks like: the question paper and its marking scheme. */
export function PaperPreview({ subject, setNo = 7 }: { subject: Subject; setNo?: number }) {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[460px] sm:h-[470px]" aria-hidden="true">
      {/* answer key page (behind) */}
      <div className="card absolute right-0 top-0 h-[370px] w-[64%] rotate-[3deg] p-5 sm:h-[390px]">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal">Marking Scheme</p>
          <p className="text-[10px] font-semibold text-muted">Set-{setNo}</p>
        </div>
        {[
          ["14", ["½", "½", "1"]],
          ["15", ["1", "1"]],
          ["16", ["½", "1", "½", "1"]],
          ["17", ["2", "1"]],
        ].map(([q, marks]) => (
          <div key={q as string} className="mt-3.5">
            <p className="text-[10px] font-bold">Q.{q as string}</p>
            {(marks as string[]).map((m, i) => (
              <div key={i} className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded bg-ink/10" style={{ maxWidth: `${80 - i * 9}%` }} />
                <span className="ml-auto text-[10px] font-bold text-teal">{m}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* question paper page (front) */}
      <div className="card absolute left-0 top-14 h-[380px] w-[62%] -rotate-[1.5deg] p-5 sm:h-[400px]">
        <p className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-muted">Practice Paper · Set-{setNo}</p>
        <p className="font-display mt-1 text-center text-[15px] font-semibold leading-tight">
          {subject.name.toUpperCase()} ({subject.code})
        </p>
        <p className="text-center text-[10px] text-muted">
          Class {classRoman(subject.classLevel)} · Session {site.session}
        </p>
        <div className="mt-2.5 flex justify-between border-y border-line py-1.5 text-[9.5px] font-semibold">
          <span>Time: {subject.hours} Hours</span>
          <span>Max. Marks: {subject.marks}</span>
        </div>
        <p className="mt-3 text-[9.5px] font-bold">General Instructions:</p>
        <div className="mt-1 space-y-1">
          {[94, 88, 72].map((w) => (
            <div key={w} className="h-1 rounded bg-ink/10" style={{ width: `${w}%` }} />
          ))}
        </div>
        <p className="mt-3.5 text-center text-[9.5px] font-bold tracking-wider">SECTION A</p>
        {[1, 2, 3].map((n) => (
          <div key={n} className="mt-2 flex gap-2 text-[9.5px]">
            <span className="font-semibold">{n}.</span>
            <Bars widths={[90 - n * 7, 55]} />
            <span className="text-muted">1</span>
          </div>
        ))}
        <p className="mt-2 text-center text-[9px] font-bold italic text-gold">OR</p>
        <div className="mt-1 flex gap-2 text-[9.5px]">
          <span className="font-semibold">&nbsp;&nbsp;</span>
          <Bars widths={[78]} />
          <span className="text-muted">1</span>
        </div>
        <p className="mt-3 text-center text-[9.5px] font-bold tracking-wider">SECTION D · CASE-BASED</p>
        <div className="mt-2 rounded-md border border-line bg-paper p-2">
          <div className="space-y-1">
            {[96, 90, 64].map((w) => (
              <div key={w} className="h-1 rounded bg-ink/10" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* callouts */}
      <span className="chip absolute -left-2 bottom-6 z-10 bg-ink py-1.5 text-white shadow-lg sm:-left-4">
        <Icon name="file" className="h-3.5 w-3.5" /> Question paper · Word + PDF
      </span>
      <span className="chip absolute -right-1 bottom-0 z-10 bg-teal py-1.5 text-white shadow-lg">
        <Icon name="checkCircle" className="h-3.5 w-3.5" /> Answer key with step marks
      </span>
    </div>
  );
}
