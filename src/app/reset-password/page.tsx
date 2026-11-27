import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

// The reset email links to /auth/callback?next=/reset-password, which signs the user in
// and sends them here to choose a new password.
export default async function ResetPasswordPage() {
  const user = await getUser();
  return (
    <div className="ruled border-b border-line">
      <div className="mx-auto max-w-md px-4 py-16 sm:py-20">
        <div className="card p-8">
          <h1 className="font-display text-3xl font-semibold">Set a new password</h1>
          {user ? (
            <ResetPasswordForm email={user.email ?? ""} />
          ) : (
            <div className="mt-4 space-y-4 text-sm text-ink-soft">
              <p>
                This reset link has expired or has already been used. Reset links work once and only for a short time.
              </p>
              <p>Go back to sign in and click <strong>Forgot password?</strong> to get a new link.</p>
              <Link href="/login" className="btn btn-primary w-full">
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
