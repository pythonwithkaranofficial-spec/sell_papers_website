import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "@/components/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell>
      {isSupabaseConfigured ? (
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-paper-deep" />}>
          <LoginForm googleEnabled={process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "true"} />
        </Suspense>
      ) : (
        <p className="rounded-2xl bg-gold-soft p-4 text-sm text-ink-soft">Sign-in will be available once the website is connected to Supabase.</p>
      )}
    </AuthShell>
  );
}
