// Site-wide settings. Change the brand name, contact details and default prices here
// (prices can also be changed per set / per subject from the admin panel once Supabase is connected).
export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "BoardPrep Papers",
  tagline: "CBSE 2026-27 practice papers, built on the official pattern",
  description:
    "Premium CBSE Class 10 and Class 12 practice papers for session 2026-27 — 30 sets per subject, each following the official CBSE Sample Question Paper pattern, with complete answer keys and marking schemes.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  session: "2026-27",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+91 00000 00000",
  businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || "BoardPrep Papers",
  businessAddress: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Your registered business address, City, State, PIN",
};

/** Default prices in paise (₹1 = 100 paise). Used for placeholders and when seeding the database. */
export const defaultPrices = {
  setPaise: 4900, // one set (question paper Word + PDF with answer key)
  subjectBundlePaise: 99900, // all 30 sets of one subject
};

export const SETS_PER_SUBJECT = 30;

export function formatINR(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}
