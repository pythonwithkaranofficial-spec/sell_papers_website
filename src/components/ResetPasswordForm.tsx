"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PasswordField } from "./LoginForm";

/** Shown after the user opens the "reset password" email link (they are signed in by that link). */
export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password !== confirm) {
      setMsg("The two passwords don't match. Please type the same password in both boxes.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMsg(
        /different from the old/i.test(error.message)
          ? "Your new password must be different from your old one."
          : error.message,
      );
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/account");
      router.refresh();
    }, 1500);
  }

  if (done) {
    return (
      <p className="mt-6 rounded-lg bg-teal-soft p-4 text-sm font-medium text-teal" role="status">
        ✓ Your password has been changed. Taking you to My papers…
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <p className="text-sm text-muted">
        Account: <span className="font-semibold text-ink">{email}</span>
      </p>
      <PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" hint="At least 6 characters" />
      <div>
        <PasswordField label="Re-enter new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {confirm.length > 0 && (
          <p className={`mt-1.5 text-xs font-medium ${confirm === password ? "text-teal" : "text-red-700"}`} aria-live="polite">
            {confirm === password ? "✓ Passwords match" : "Passwords don't match yet"}
          </p>
        )}
      </div>
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Please wait…" : "Save new password"}
      </button>
      {msg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p>}
      <p className="text-center text-sm">
        <Link href="/account" className="font-semibold text-muted hover:text-ink">
          Skip for now
        </Link>
      </p>
    </form>
  );
}
