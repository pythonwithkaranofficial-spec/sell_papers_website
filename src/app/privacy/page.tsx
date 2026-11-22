import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="22 November 2026">
      <p>{site.businessName} respects your privacy. This policy explains what we collect when you use {site.name}.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: your email address and, if you give it, your name.</li>
        <li>Order details: what you bought, the amount, and the Razorpay order and payment IDs.</li>
        <li>Basic technical data needed to keep you signed in (secure cookies).</li>
      </ul>
      <p>We never receive or store your card, UPI or bank details — Razorpay handles payments directly.</p>
      <h2>How we use it</h2>
      <p>To create your account, deliver the papers you buy, provide support, and comply with tax and legal requirements. We do not sell your data.</p>
      <h2>Service providers</h2>
      <p>We use Supabase (accounts, database and file storage), Razorpay (payments) and Vercel (website hosting). They process data only to provide these services.</p>
      <h2>Your choices</h2>
      <p>You can ask us to correct or delete your account by writing to {site.supportEmail}. Records we must keep by law (such as invoices) are retained as required.</p>
      <h2>Contact</h2>
      <p>{site.businessName}, {site.businessAddress} · {site.supportEmail}</p>
    </LegalPage>
  );
}
