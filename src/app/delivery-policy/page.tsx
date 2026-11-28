import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Delivery Policy" };

export default function Delivery() {
  return (
    <LegalPage title="Delivery Policy" updated="22 November 2026">
      <p>All products on {site.name} are digital. Nothing is shipped physically.</p>
      <h2>How you receive your papers</h2>
      <ul>
        <li>Immediately after a successful payment, the purchased set (or subject bundle) appears under “My papers” in your account.</li>
        <li>You can download the Word file and the PDF (question paper with answer key) as many times as you like.</li>
        <li>For a subject bundle, sets uploaded later are added to your account automatically at no extra cost.</li>
      </ul>
      <h2>Delays</h2>
      <p>If a purchase does not appear within 15 minutes of payment, write to {site.supportEmail} with your payment / transaction ID and we will fix it promptly.</p>
    </LegalPage>
  );
}
