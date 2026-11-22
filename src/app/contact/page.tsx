import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact us" };

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Support</p>
      <h1 className="font-display mt-2 text-4xl font-semibold">Contact us</h1>
      <p className="mt-4 text-ink-soft">Questions about a paper, a payment or your account? We usually reply within one working day.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">Email</p>
          <a href={`mailto:${site.supportEmail}`} className="mt-1 block text-lg font-semibold hover:text-gold">{site.supportEmail}</a>
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold text-muted">Phone / WhatsApp</p>
          <p className="mt-1 text-lg font-semibold">{site.supportPhone}</p>
        </div>
        <div className="card p-6 sm:col-span-2">
          <p className="text-sm font-semibold text-muted">Business</p>
          <p className="mt-1 font-semibold">{site.businessName}</p>
          <p className="text-ink-soft">{site.businessAddress}</p>
        </div>
      </div>
    </div>
  );
}
