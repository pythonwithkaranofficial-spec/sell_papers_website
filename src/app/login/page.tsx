import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { site } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  return (
    <div className="ruled border-b border-line">
      <div className="mx-auto flex max-w-md flex-col px-4 py-20">
        <div className="card p-8">
          <h1 className="font-display text-3xl font-semibold">Welcome</h1>
          <p className="mt-2 text-sm text-muted">Sign in or create your {site.name} account to buy and download papers.</p>
          {isSupabaseConfigured ? (
            <LoginForm next={safeNext} googleEnabled={process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "true"} />
          ) : (
            <p className="mt-6 rounded-lg bg-gold-soft p-4 text-sm text-ink-soft">
              Sign-in will be available once the website is connected to Supabase.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
