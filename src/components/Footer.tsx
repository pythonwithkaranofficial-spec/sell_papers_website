import Link from "next/link";
import { site } from "@/lib/site";
import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { PaymentMethods } from "./Trust";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/classes/10", label: "Class 10 papers" },
      { href: "/classes/12", label: "Class 12 papers" },
      { href: "/papers", label: "All subjects" },
      { href: "/#pricing", label: "Pricing" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/about", label: "About us" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#faq", label: "FAQ" },
      { href: "/account", label: "My papers" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/refund-policy", label: "Refund & Cancellation" },
      { href: "/delivery-policy", label: "Delivery Policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white/75">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid shrink-0 place-items-center rounded-[12px] bg-white p-[3px]">
              <Logo size={30} />
            </span>
            <span className="font-display text-lg font-semibold leading-tight text-white">{site.name}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            Premium CBSE practice papers for Class 10 and Class 12, session {site.session} — every set with a complete answer key
            and marking scheme.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            <li className="flex items-center gap-2.5">
              <Icon name="mail" className="h-4 w-4 text-gold-bright" />
              <a href={`mailto:${site.supportEmail}`} className="hover:text-white">
                {site.supportEmail}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Icon name="phone" className="h-4 w-4 text-gold-bright" />
              <a href={`tel:${site.supportPhone.replace(/[^\d+]/g, "")}`} className="hover:text-white">
                {site.supportPhone}
              </a>
            </li>
          </ul>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-semibold text-white">{c.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-end md:justify-between">
          <PaymentMethods dark />
          <p className="max-w-md text-xs leading-relaxed text-white/45 md:text-right">
            Independent practice material prepared on the pattern of the CBSE Sample Question Papers {site.session}. Not affiliated
            with or endorsed by the Central Board of Secondary Education.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} {site.businessName}. All rights reserved.
      </div>
    </footer>
  );
}
