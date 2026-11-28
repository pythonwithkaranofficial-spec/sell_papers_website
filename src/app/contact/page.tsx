import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact us" };

export default function Contact() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="eyebrow">Support</p>
      <h1 className="font-display mt-2 text-4xl font-semibold">We&apos;re here to help</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Questions about a paper, a payment or your account? Write to us and we usually reply within one working day. For payment
        issues, please include your payment / transaction ID.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <a href={`mailto:${site.supportEmail}`} className="card card-hover group p-6">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-soft text-gold">
            <Icon name="mail" />
          </span>
          <p className="mt-4 text-sm font-semibold text-muted">Email</p>
          <p className="mt-1 break-all text-lg font-semibold group-hover:text-gold">{site.supportEmail}</p>
        </a>
        <div className="card p-6">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-soft text-gold">
            <Icon name="phone" />
          </span>
          <p className="mt-4 text-sm font-semibold text-muted">Phone / WhatsApp</p>
          <a href={`tel:${site.supportPhone.replace(/[^\d+]/g, "")}`} className="mt-1 block text-lg font-semibold hover:text-gold">
            {site.supportPhone}
          </a>
          <a
            href={`https://wa.me/${site.supportPhone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-gold underline underline-offset-4"
          >
            Chat on WhatsApp
          </a>
        </div>
        <div className="card p-6 sm:col-span-2">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-soft text-gold">
            <Icon name="pin" />
          </span>
          <p className="mt-4 text-sm font-semibold text-muted">Business</p>
          <p className="mt-1 font-semibold">{site.businessName}</p>
          <p className="text-ink-soft">{site.businessAddress}</p>
        </div>
      </div>
      <div className="mt-10 rounded-2xl border border-line bg-paper-deep p-6 text-sm text-ink-soft">
        <p className="font-semibold text-ink">Quick answers</p>
        <ul className="mt-3 space-y-2">
          <li>
            Paid but can&apos;t see your papers? Check{" "}
            <Link href="/account" className="font-semibold underline underline-offset-2">
              My papers
            </Link>{" "}
            while signed in with the same email — see our{" "}
            <Link href="/delivery-policy" className="font-semibold underline underline-offset-2">
              delivery policy
            </Link>
            .
          </li>
          <li>
            Refunds are handled as described in our{" "}
            <Link href="/refund-policy" className="font-semibold underline underline-offset-2">
              refund &amp; cancellation policy
            </Link>
            .
          </li>
        </ul>
      </div>
    </div>
  );
}
