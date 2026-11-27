"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "magic" | "reset";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const requested = useSearchParams().get("next");
  const next = requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : "/account";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Countdown before another code can be requested (Supabase allows one email per minute per address).
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function sendCode() {
    setMsg(null);
    setBusy(true);
    try {
      const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: callback() } });
      if (error) throw error;
      setCodeSent(true);
      setCode("");
      setCooldown(60);
      setMsg({ ok: true, text: `We sent a sign-in code to ${email}. It can take a minute to arrive — check your spam folder too.` });
    } catch (err) {
      const text = err instanceof Error ? err.message : "Something went wrong";
      setMsg({ ok: false, text: /security purposes|seconds/i.test(text) ? "Please wait a minute before asking for another code." : text });
    } finally {
      setBusy(false);
    }
  }
  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (mode === "signup" && password !== confirm) {
      setMsg({ ok: false, text: "The two passwords don't match. Please type the same password in both boxes." });
      return;
    }
    setBusy(true);
    const supabase = createClient();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: callback() },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else setMsg({ ok: true, text: "Account created. Please confirm your email using the link we sent you." });
      } else if (mode === "reset") {
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setMsg({
          ok: true,
          text: "If an account exists for this email, we've sent a link to set a new password. Check your inbox (and spam folder).",
        });
      } else if (!codeSent) {
        setBusy(false);
        await sendCode();
        return;
      } else {
        const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
        if (error) {
          setMsg({ ok: false, text: "That code is wrong or has expired. Use the code from the latest email, or send a new code." });
          return;
        }
        setMsg({ ok: true, text: "✓ Signed in. Opening your papers…" });
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
  }

  const tabs: [Mode, string, string][] = [
    ["signin", "Sign in", "Sign in"],
    ["signup", "Create account", "Sign up"],
    ["magic", "Email code", "Email code"],
  ];

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-1 rounded-full bg-paper p-1 text-[13px] sm:text-sm">
        {tabs.map(([m, l, short]) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setMsg(null); setConfirm(""); setCodeSent(false); setCode(""); }}
            className={`whitespace-nowrap rounded-full px-1 py-1.5 font-semibold ${mode === m || (mode === "reset" && m === "signin") ? "bg-white shadow-sm" : "text-muted"}`}
          >
            <span className="hidden sm:inline">{l}</span>
            <span className="sm:hidden">{short}</span>
          </button>
        ))}
      </div>
      {mode === "reset" && (
        <div className="mt-6 rounded-xl bg-paper p-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">Forgot your password?</p>
          <p className="mt-1">Enter the email you signed up with and we&apos;ll send you a link to set a new password.</p>
        </div>
      )}
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <Field label="Full name" value={name} onChange={setName} autoComplete="name" />
        )}
        {mode === "magic" && !codeSent && (
          <p className="rounded-xl bg-paper p-3 text-sm text-ink-soft">
            No password needed. We&apos;ll email you a sign-in code — read it on any device and type it here.
          </p>
        )}
        {mode === "magic" && codeSent ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              Code sent to <span className="font-semibold text-ink">{email}</span>{" "}
              <button
                type="button"
                onClick={() => { setCodeSent(false); setCode(""); setMsg(null); }}
                className="font-semibold text-ink-soft underline decoration-gold underline-offset-4 hover:text-ink"
              >
                Change
              </button>
            </p>
            <label className="block">
              <span className="text-sm font-medium">Sign-in code from the email</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                required
                autoFocus
                placeholder="e.g. 482913"
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-center text-xl font-semibold tracking-[0.4em] outline-none placeholder:text-base placeholder:font-normal placeholder:tracking-normal focus:border-ink"
              />
            </label>
          </div>
        ) : (
          <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        )}
        {(mode === "signin" || mode === "signup") && (
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            hint={mode === "signup" ? "At least 6 characters" : undefined}
          />
        )}
        {mode === "signin" && (
          <p className="-mt-2 text-right">
            <button
              type="button"
              onClick={() => { setMode("reset"); setMsg(null); }}
              className="text-sm font-semibold text-ink-soft underline decoration-gold underline-offset-4 hover:text-ink"
            >
              Forgot password?
            </button>
          </p>
        )}
        {mode === "signup" && (
          <div>
            <PasswordField label="Re-enter password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
            {confirm.length > 0 && (
              <p className={`mt-1.5 text-xs font-medium ${confirm === password ? "text-teal" : "text-red-700"}`} aria-live="polite">
                {confirm === password ? "✓ Passwords match" : "Passwords don't match yet"}
              </p>
            )}
          </div>
        )}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : mode === "reset"
                  ? "Send reset link"
                  : codeSent
                    ? "Sign in with code"
                    : "Send me a code"}
        </button>
        {mode === "magic" && codeSent && (
          <button
            type="button"
            onClick={sendCode}
            disabled={busy || cooldown > 0}
            className="w-full text-center text-sm font-semibold text-ink-soft hover:text-ink disabled:cursor-not-allowed disabled:text-muted"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        )}
        {mode === "reset" && (
          <button type="button" onClick={() => { setMode("signin"); setMsg(null); }} className="w-full text-center text-sm font-semibold text-muted hover:text-ink">
            ← Back to sign in
          </button>
        )}
      </form>
      {googleEnabled && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <button type="button" onClick={google} className="btn btn-outline w-full">Continue with Google</button>
        </>
      )}
      {msg && <p className={`mt-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-teal-soft text-teal" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        required={props.required}
        minLength={props.minLength}
        className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-2.5 outline-none focus:border-ink"
      />
    </label>
  );
}

export function PasswordField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm font-medium">
        {props.label}
        {props.hint && <span className="text-xs font-normal text-muted">{props.hint}</span>}
      </span>
      <span className="relative mt-1.5 block">
        <input
          type={show ? "text" : "password"}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          autoComplete={props.autoComplete}
          required
          minLength={6}
          className="w-full rounded-xl border border-line bg-white py-2.5 pl-4 pr-12 outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-1 my-auto grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-paper hover:text-ink"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          title={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff /> : <Eye />}
        </button>
      </span>
    </label>
  );
}

function Eye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1" />
      <path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a10.4 10.4 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}
