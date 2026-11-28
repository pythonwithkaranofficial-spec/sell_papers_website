import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Refund & Cancellation Policy" };

export default function Refund() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="22 November 2026">
      <p>Our products are digital files that are delivered instantly after payment, so orders cannot be cancelled once a download is available.</p>
      <h2>When we refund</h2>
      <ul>
        <li>You were charged but the papers did not appear in “My papers” and we cannot resolve it within 48 hours.</li>
        <li>You were charged twice for the same product.</li>
        <li>A file is corrupted or unreadable and we cannot provide a working replacement within 72 hours.</li>
      </ul>
      <h2>How to request</h2>
      <p>Email {site.supportEmail} within 7 days of purchase with your registered email address and the payment / transaction ID. Approved refunds are credited to the original payment method within 5–7 working days.</p>
      <h2>Not refundable</h2>
      <p>Change of mind after a file has been downloaded, or purchases made by mistake for a different class or subject once downloaded.</p>
    </LegalPage>
  );
}
