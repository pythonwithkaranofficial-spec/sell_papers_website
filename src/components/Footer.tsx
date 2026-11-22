import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-ink text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-lg font-semibold text-white">{site.name}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">{site.description}</p>
          <p className="mt-4 text-xs text-white/45">
            Independent practice material prepared on the pattern of the CBSE Sample Question Papers {site.session}. Not
            affiliated with or endorsed by CBSE.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Papers</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/classes/10" className="hover:text-white">Class 10</Link></li>
            <li><Link href="/classes/12" className="hover:text-white">Class 12</Link></li>
            <li><Link href="/account" className="hover:text-white">My papers</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Policies</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/terms" className="hover:text-white">Terms &amp; Conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/refund-policy" className="hover:text-white">Refund &amp; Cancellation</Link></li>
            <li><Link href="/delivery-policy" className="hover:text-white">Delivery Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} {site.businessName}. All rights reserved.
      </div>
    </footer>
  );
}
