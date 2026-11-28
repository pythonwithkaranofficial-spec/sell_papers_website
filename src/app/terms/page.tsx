import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function Terms() {
  return (
    <LegalPage title="Terms & Conditions" updated="22 November 2026">
      <p>These terms govern your use of {site.name} ({site.url}), operated by {site.businessName}, {site.businessAddress}. By creating an account or buying a product you agree to them.</p>
      <h2>Products</h2>
      <p>We sell digital practice papers for CBSE Class 10 and Class 12 (session {site.session}). Each set includes a question paper (Word file) and a PDF with the question paper and its answer key. The papers are independent practice material prepared on the pattern of the official CBSE Sample Question Papers and are not issued, affiliated with or endorsed by CBSE.</p>
      <h2>Licence</h2>
      <ul>
        <li>On purchase you receive a personal, non-transferable licence to download, print and use the files for your own study, or for teaching your own students.</li>
        <li>You may not resell, republish, upload to other websites or groups, or distribute the files commercially.</li>
      </ul>
      <h2>Accounts</h2>
      <p>You are responsible for keeping your login details secure. Purchases are linked to your account and remain available for download under “My papers”.</p>
      <h2>Pricing and payment</h2>
      <p>Prices are shown in Indian Rupees and include applicable taxes. Payments are processed securely by our RBI-authorised payment gateway; we do not store card, UPI or bank details.</p>
      <h2>Accuracy</h2>
      <p>We take great care over every question and answer. If you find an error, write to {site.supportEmail} and we will correct it and update the file for all buyers.</p>
      <h2>Liability</h2>
      <p>The papers are for practice. We do not guarantee any examination result. Our total liability for any claim is limited to the amount you paid for the product concerned.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India. Contact: {site.supportEmail} · {site.supportPhone}.</p>
    </LegalPage>
  );
}
