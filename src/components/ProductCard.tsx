import Link from "next/link";
import { streamColor, type Subject } from "@/lib/catalog";
import type { SubjectSummary } from "@/lib/data";
import { formatINR, SETS_PER_SUBJECT } from "@/lib/site";
import { Icon } from "./Icon";
import { SubjectCover } from "./SubjectCover";

export function bundleSaving(setPricePaise: number, bundlePricePaise: number) {
  const full = setPricePaise * SETS_PER_SUBJECT;
  return full > bundlePricePaise ? Math.round((1 - bundlePricePaise / full) * 100) : 0;
}

/** Store tile for one subject (links to its product page). */
export function ProductCard({ subject, summary }: { subject: Subject; summary: SubjectSummary }) {
  const color = streamColor(subject.stream);
  const save = bundleSaving(summary.setPricePaise, summary.bundlePricePaise);
  const hindi = subject.language === "hi" ? "font-[family-name:var(--font-hindi)]" : "";
  return (
    <Link
      href={`/classes/${subject.classLevel}/${subject.slug}`}
      className="card card-hover group flex flex-col overflow-hidden"
      aria-label={`Class ${subject.classLevel} ${subject.name} practice papers`}
    >
      <div className="relative grid place-items-center px-6 pb-6 pt-8" style={{ background: `linear-gradient(160deg, ${color}10, ${color}2e)` }}>
        {save > 0 && (
          <span className="chip absolute left-3 top-3 bg-white/95 text-gold shadow-sm">
            <Icon name="tag" className="h-3.5 w-3.5" /> Bundle saves {save}%
          </span>
        )}
        <div className="relative w-[46%] min-w-[120px] max-w-[170px]">
          <div className="absolute inset-0 translate-x-[8%] translate-y-[3%] rotate-[5deg] opacity-50">
            <div className="cover" style={{ backgroundColor: color }} />
          </div>
          <SubjectCover subject={subject} className="transition duration-300 group-hover:-translate-y-1 group-hover:-rotate-1" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Class {subject.classLevel} · Code {subject.code} · {subject.stream}
        </p>
        <h3 className="mt-1 text-[1.05rem] font-semibold leading-snug">{subject.name}</h3>
        <p className={`mt-1 line-clamp-2 text-sm leading-relaxed text-muted ${hindi}`}>{subject.blurb}</p>
        <Availability ready={summary.available} />
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">All {SETS_PER_SUBJECT} sets</p>
            <p className="font-display text-2xl font-semibold">{formatINR(summary.bundlePricePaise)}</p>
            <p className="text-xs text-muted">or {formatINR(summary.setPricePaise)} per set</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white transition group-hover:bg-gold">
            <Icon name="arrowRight" className="h-4.5 w-4.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function Availability({ ready, dark }: { ready: number; dark?: boolean }) {
  const pct = Math.round((ready / SETS_PER_SUBJECT) * 100);
  const label =
    ready >= SETS_PER_SUBJECT
      ? `All ${SETS_PER_SUBJECT} sets available`
      : ready > 0
        ? `${ready} of ${SETS_PER_SUBJECT} sets available · more being added`
        : "Coming soon — sets are being prepared";
  return (
    <div className="my-4">
      <div className={`h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-paper-deep"}`}>
        <div className={`h-full rounded-full ${ready ? "bg-teal" : "bg-transparent"}`} style={{ width: `${Math.max(pct, ready ? 4 : 0)}%` }} />
      </div>
      <p className={`mt-1.5 text-xs font-medium ${ready ? (dark ? "text-teal-soft" : "text-teal") : dark ? "text-white/60" : "text-muted"}`}>{label}</p>
    </div>
  );
}
