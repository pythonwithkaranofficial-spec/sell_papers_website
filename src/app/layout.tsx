import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { site } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm", display: "swap" });
// Fraunces is only used on the book covers.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });


export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — CBSE ${site.session} Practice Papers`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { title: site.name, description: site.description, type: "website", locale: "en_IN" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
