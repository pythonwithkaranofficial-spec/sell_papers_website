import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

// The reset email links to /auth/callback?next=/reset-password, which signs the user in
// and sends them here to choose a new password.
export default async function ResetPasswordPage() {
  const user = await getUser();
  return (
    <AuthShell>
      <h1 className="font-display text-[2rem] leading-tight sm:text-[2.25rem]">Set a new password</h1>
      {user ? (
        <ResetPasswordForm email={user.email ?? ""} />
      ) : (
        <div className="mt-4 space-y-4 text-[15px] text-ink-soft">
          <p>This reset link has expired or has already been used. Reset links work once and only for a short time.</p>
          <p>
            Go back to sign in and click <strong>Forgot password?</strong> to get a new link.
          </p>
          <Link href="/login" className="btn btn-primary btn-lg w-full !rounded-2xl">
            Back to sign in
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
