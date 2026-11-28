"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "magic" | "reset";

const HEADINGS: Record<Mode, [string, string]> = {
  signin: ["Welcome back", "Sign in to buy and download your papers."],
  signup: ["Create your account", "Free to join — buy once, download any time on any device."],
  magic: ["Sign in with a code", "No password needed. We'll email you a code — read it on any device and type it here."],
  reset: ["Reset your password", "Enter the email you signed up with and we'll send you a link to set a new password."],
};

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("next");
  const next = requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : "/account";
  const initialMode = (["signin", "signup", "magic", "reset"] as Mode[]).find((m) => m === params.get("mode")) ?? "signin";
  const [mode, setModeRaw] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const setMode = (m: Mode) => {
    setModeRaw(m);
    setMsg(null);
    setConfirm("");
    setCodeSent(false);
    setCode("");
  };

  // Countdown before another code can be requested (Supabase allows one email per minute per address).
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

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

  const [title, subtitle] = HEADINGS[mode];
  const linkBtn = "font-semibold text-gold underline decoration-[#a9c4f5] underline-offset-4 hover:text-teal";

  return (
    <div>
      <h1 className="font-display text-[2rem] leading-tight sm:text-[2.25rem]">{title}</h1>
      <p className="mt-2 text-[15px] text-muted">{subtitle}</p>

      {googleEnabled && (mode === "signin" || mode === "signup") && (
        <>
          <button type="button" onClick={google} className="btn btn-outline mt-7 w-full !rounded-2xl shadow-sm">
            <GoogleMark /> {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
          </button>
          <Divider />
        </>
      )}

      <form onSubmit={submit} className={`${googleEnabled && (mode === "signin" || mode === "signup") ? "" : "mt-7"} space-y-4`}>
        {mode === "signup" && <Field label="Full name" value={name} onChange={setName} autoComplete="name" />}

        {mode === "magic" && codeSent ? (
          <div className="space-y-4">
            <p className="rounded-2xl bg-gold-soft px-4 py-3 text-sm text-ink-soft">
              Code sent to <span className="font-semibold text-ink">{email}</span> ·{" "}
              <button type="button" onClick={() => { setCodeSent(false); setCode(""); setMsg(null); }} className={linkBtn}>
                Change email
              </button>
            </p>
            <label className="block">
              <Label text="Sign-in code from the email" required />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                required
                autoFocus
                placeholder="e.g. 48291375"
                className={`${INPUT} text-center text-xl font-semibold tracking-[0.35em] placeholder:text-base placeholder:font-normal placeholder:tracking-normal`}
              />
            </label>
          </div>
        ) : (
          <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        )}

        {(mode === "signin" || mode === "signup") && (
          <PasswordField
            label={mode === "signup" ? "Create your password" : "Password"}
            value={password}
            onChange={setPassword}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            hint={mode === "signup" ? "At least 6 characters" : undefined}
          />
        )}
        {mode === "signin" && (
          <p className="-mt-1 text-right text-sm">
            <button type="button" onClick={() => setMode("reset")} className={linkBtn}>
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

        <button className="btn btn-primary btn-lg w-full !rounded-2xl" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create your account"
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
      </form>

      {msg && (
        <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${msg.ok ? "bg-teal-soft text-teal" : "bg-red-50 text-red-700"}`} role="status">
          {msg.text}
        </p>
      )}

      {(mode === "signin" || mode === "signup") && (
        <>
          <Divider />
          <button type="button" onClick={() => setMode("magic")} className="btn btn-outline w-full !rounded-2xl">
            <MailMark /> {mode === "signup" ? "Sign up with an email code instead" : "Sign in with an email code"}
          </button>
        </>
      )}

      {mode === "signup" && (
        <p className="mt-5 text-center text-xs leading-relaxed text-muted">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
          <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
        </p>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => setMode("signin")} className={linkBtn}>Sign in</button>
          </>
        ) : mode === "signin" ? (
          <>
            New here?{" "}
            <button type="button" onClick={() => setMode("signup")} className={linkBtn}>Create an account</button>
          </>
        ) : (
          <button type="button" onClick={() => setMode("signin")} className={linkBtn}>← Back to sign in</button>
        )}
      </p>
    </div>
  );
}

const INPUT =
  "mt-1.5 w-full rounded-2xl border border-[#cfcfcf] bg-white px-4 py-2.5 text-[15px] shadow-[0_1px_2px_rgba(28,28,28,0.06)] outline-none transition focus:border-gold focus:ring-4 focus:ring-[#bcd7ff]/50";

function Label({ text, required, hint }: { text: string; required?: boolean; hint?: string }) {
  return (
    <span className="flex items-baseline justify-between text-[15px] font-medium text-ink">
      <span>
        {text}
        {required && <span className="ml-0.5 text-red-600"> *</span>}
      </span>
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </span>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted">
      <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
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
}) {
  return (
    <label className="block">
      <Label text={props.label} required={props.required} />
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        required={props.required}
        className={INPUT}
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
      <Label text={props.label} required hint={props.hint} />
      <span className="relative block">
        <input
          type={show ? "text" : "password"}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          autoComplete={props.autoComplete}
          required
          minLength={6}
          className={`${INPUT} !pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute bottom-0 right-1.5 top-1.5 my-auto grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-paper-deep hover:text-ink"
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

function MailMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
