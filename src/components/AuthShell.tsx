import Link from "next/link";
import { subjectById } from "@/lib/catalog";
import { site } from "@/lib/site";
import { Icon, type IconName } from "./Icon";
import { Logo } from "./Logo";
import { SubjectCover } from "./SubjectCover";

const points: [IconName, string][] = [
  ["layers", "30 full-length sets per subject"],
  ["checkCircle", "Answer keys with step marking"],
  ["bolt", "Instant download, any device"],
];

/** Split-screen frame for sign-in / sign-up / password screens: lime illustration panel + white form panel. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const covers = ["class-10-science", "class-12-physics", "class-10-mathematics-standard"].map((id) => subjectById(id)!);
  return (
    <div className="-mb-24 grid min-h-[calc(100vh-7rem)] lg:grid-cols-2">
      {/* illustration panel */}
      <div className="relative hidden overflow-hidden bg-lime lg:block" aria-hidden="true">
        {/* thin connector lines with sparkles */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 800" preserveAspectRatio="none" fill="none">
          <path d="M600 150 H520 Q500 150 500 170 V330 Q500 350 480 350 H430" stroke="#0d0d0d" strokeWidth="1.6" />
          <path d="M0 560 H60 Q80 560 80 580 V700" stroke="#0d0d0d" strokeWidth="1.6" />
        </svg>
        <Sparkle className="absolute left-[calc(83%-11px)] top-[calc(21%-11px)]" />
        <Sparkle className="absolute left-[calc(13%-11px)] top-[calc(87%-11px)]" />

        <div className="relative flex h-full flex-col items-center justify-center px-10 py-16">
          <div className="relative h-56 w-80">
            <div className="absolute left-2 top-6 w-28 -rotate-[9deg]">
              <SubjectCover subject={covers[0]} />
            </div>
            <div className="absolute right-2 top-6 w-28 rotate-[8deg]">
              <SubjectCover subject={covers[2]} />
            </div>
            <div className="absolute left-1/2 top-0 w-32 -translate-x-1/2">
              <SubjectCover subject={covers[1]} />
            </div>
          </div>
          <div className="relative mt-8 w-full max-w-sm rounded-[22px] border-[1.6px] border-ink bg-[#fffdf6] p-6 text-center shadow-[0_6px_0_#0d0d0d]">
            <p className="font-display text-xl leading-snug">
              Board-exam practice for <strong className="font-semibold">Class 10 &amp; 12</strong>
            </p>
            <ul className="mt-5 space-y-2.5 text-left">
              {points.map(([icon, text]) => (
                <li key={text} className="flex items-center gap-3 rounded-full border-[1.6px] border-ink bg-white px-4 py-2 text-sm font-medium">
                  <Icon name={icon} className="h-4.5 w-4.5 text-gold" /> {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center bg-white px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="mb-8 inline-flex items-center gap-2">
            <Logo size={30} />
            <span className="font-display text-lg font-semibold text-gold">{site.name}</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" className={className}>
      <path d="M11 0 C12 7 15 10 22 11 C15 12 12 15 11 22 C10 15 7 12 0 11 C7 10 10 7 11 0 Z" fill="#fff" stroke="#0d0d0d" strokeWidth="1.4" />
    </svg>
  );
}
