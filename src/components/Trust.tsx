import { site } from "@/lib/site";
import { Icon, type IconName } from "./Icon";

export const TRUST_POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: "shield", title: "Secure checkout", text: "Payments by Razorpay — UPI, cards, net banking" },
  { icon: "bolt", title: "Instant download", text: "Files unlock the moment you pay" },
  { icon: "target", title: `${site.session} syllabus only`, text: "On the official CBSE sample paper pattern" },
  { icon: "clipboard", title: "Answer keys included", text: "Step-wise marking scheme with every set" },
  { icon: "infinity", title: "Lifetime access", text: "Download again any time from My papers" },
];

/** Horizontal strip of the store's guarantees. */
export function TrustBar({ className = "" }: { className?: string }) {
  return (
    <div className={`border-y border-line bg-white ${className}`}>
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-5 px-4 py-6 sm:px-6 md:grid-cols-3 lg:grid-cols-5">
        {TRUST_POINTS.map((t) => (
          <li key={t.title} className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold">
              <Icon name={t.icon} />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">{t.title}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted">{t.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const METHODS = ["UPI", "RuPay", "Visa", "Mastercard", "Net banking", "Wallets"];

/** Accepted payment methods + "secured by Razorpay" line. */
export function PaymentMethods({ dark, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <div className={className}>
      <ul className="flex flex-wrap gap-1.5">
        {METHODS.map((m) => (
          <li
            key={m}
            className={`rounded-md border px-2 py-1 text-[11px] font-bold tracking-wide ${
              dark ? "border-white/15 bg-white/5 text-white/80" : "border-line bg-white text-ink-soft"
            }`}
          >
            {m}
          </li>
        ))}
      </ul>
      <p className={`mt-2 flex items-center gap-1.5 text-xs ${dark ? "text-white/55" : "text-muted"}`}>
        <Icon name="lock" className="h-3.5 w-3.5" /> 100% secure payments processed by Razorpay. We never see your card or UPI details.
      </p>
    </div>
  );
}

export function SectionTitle({
  kicker,
  title,
  text,
  center,
  dark,
}: {
  kicker: string;
  title: string;
  text?: string;
  center?: boolean;
  dark?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className={`eyebrow ${dark ? "!text-gold-bright" : ""}`}>{kicker}</p>
      <h2 className={`font-display balance mt-2 text-3xl font-semibold sm:text-4xl ${dark ? "text-white" : ""}`}>{title}</h2>
      {text && <p className={`mt-3 leading-relaxed ${dark ? "text-white/70" : "text-ink-soft"}`}>{text}</p>}
    </div>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((f) => (
        <details key={f.q} className="card group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            {f.q}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper text-lg leading-none text-gold transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
