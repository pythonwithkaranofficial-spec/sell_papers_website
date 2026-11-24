import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { LoginForm } from "@/components/LoginForm";
import { site } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Sign in" };

const perks: [IconName, string, string][] = [
  ["download", "All your papers in one place", "Everything you buy stays in My papers, ready to download again."],
  ["bolt", "Instant delivery", "Files unlock the moment your payment succeeds."],
  ["lock", "Safe & private", "Secure sign-in. Payments are handled by Razorpay."],
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  return (
    <div className="ruled border-b border-line">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_420px] md:py-20">
        <div className="hidden md:block">
          <p className="eyebrow">Your account</p>
          <h1 className="font-display mt-2 text-4xl font-semibold leading-tight">Sign in to buy and download your papers</h1>
          <p className="mt-3 max-w-md text-ink-soft">
            A free {site.name} account keeps every purchase safe, so you can download your files on any device.
          </p>
          <ul className="mt-8 space-y-5">
            {perks.map(([icon, t, d]) => (
              <li key={t} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold">
                  <Icon name={icon} />
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="mt-0.5 text-sm text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-8">
          <h2 className="font-display text-3xl font-semibold">Welcome</h2>
          <p className="mt-2 text-sm text-muted">Sign in or create your free account.</p>
          {isSupabaseConfigured ? (
            <LoginForm next={safeNext} googleEnabled={process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "true"} />
          ) : (
            <p className="mt-6 rounded-lg bg-gold-soft p-4 text-sm text-ink-soft">
              Sign-in will be available once the website is connected to Supabase.
            </p>
          )}
          <p className="mt-6 text-center text-xs text-muted">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
