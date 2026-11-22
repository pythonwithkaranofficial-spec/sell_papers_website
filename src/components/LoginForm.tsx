"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "magic";

export function LoginForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
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
      } else {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callback() } });
        if (error) throw error;
        setMsg({ ok: true, text: "Check your inbox — we sent you a sign-in link." });
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

  const tabs: [Mode, string][] = [
    ["signin", "Sign in"],
    ["signup", "Create account"],
    ["magic", "Email link"],
  ];

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3 gap-1 rounded-full bg-paper p-1 text-sm">
        {tabs.map(([m, l]) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setMsg(null); }}
            className={`rounded-full py-1.5 font-semibold ${mode === m ? "bg-white shadow-sm" : "text-muted"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <Field label="Full name" value={name} onChange={setName} autoComplete="name" />
        )}
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        {mode !== "magic" && (
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
          />
        )}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send me a sign-in link"}
        </button>
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
