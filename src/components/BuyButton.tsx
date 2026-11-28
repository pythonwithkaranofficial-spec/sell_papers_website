"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  type: "paper" | "subject";
  paperId?: string;
  subjectId?: string;
  label: string;
  className?: string;
  signedIn: boolean;
  returnTo: string;
};

type RazorpayOptions = Record<string, unknown> & { handler: (r: Record<string, string>) => void };
type CashfreeResult = { error?: { message?: string }; paymentDetails?: { paymentMessage?: string }; redirect?: boolean };
type CashfreeInstance = { checkout: (o: { paymentSessionId: string; redirectTarget: "_modal" | "_self" }) => Promise<CashfreeResult> };
declare global {
  interface Window {
    Razorpay?: new (o: RazorpayOptions) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
    Cashfree?: (o: { mode: "sandbox" | "production" }) => CashfreeInstance;
  }
}

const scripts = new Map<string, Promise<boolean>>();
function loadScript(src: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  let p = scripts.get(src);
  if (!p) {
    p = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve(true);
      s.onerror = () => {
        scripts.delete(src);
        resolve(false);
      };
      document.body.appendChild(s);
    });
    scripts.set(src, p);
  }
  return p;
}
const CASHFREE_JS = "https://sdk.cashfree.com/js/v3/cashfree.js";
const RAZORPAY_JS = "https://checkout.razorpay.com/v1/checkout.js";

export function BuyButton({ type, paperId, subjectId, label, className, signedIn, returnTo }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [askPhone, setAskPhone] = useState(false);
  const [phone, setPhone] = useState("");

  async function confirm(body: Record<string, unknown>) {
    const v = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const out = await v.json().catch(() => ({}));
    return { ok: v.ok, out };
  }

  async function buy() {
    setMsg(null);
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(returnTo)}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, paperId, subjectId, phone: askPhone ? phone : undefined }),
      });
      const order = await res.json();
      if (order.needPhone) {
        setAskPhone(true);
        if (askPhone) setMsg({ ok: false, text: order.error });
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error(order.error || "Could not start payment");
      setAskPhone(false);

      if (order.gateway === "cashfree") {
        if (!(await loadScript(CASHFREE_JS)) || !window.Cashfree) throw new Error("Could not load the payment window. Check your connection.");
        const cashfree = window.Cashfree({ mode: order.mode });
        await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: "_modal" });
        // Whatever the popup reports, ask our server — it checks with Cashfree before unlocking anything.
        const { ok, out } = await confirm({ gateway: "cashfree", orderId: order.orderId });
        setBusy(false);
        if (ok) {
          setMsg({ ok: true, text: "Payment successful! Your papers are ready in My papers." });
          router.refresh();
        } else setMsg({ ok: false, text: out.error || "Payment not completed." });
        return;
      }

      if (!(await loadScript(RAZORPAY_JS)) || !window.Razorpay) throw new Error("Could not load the payment window. Check your connection.");
      const rz = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: { email: order.email },
        theme: { color: "#0e1b33" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (r: Record<string, string>) => {
          const { ok, out } = await confirm(r);
          setBusy(false);
          if (!ok) {
            setMsg({ ok: false, text: out.error || "Payment received but verification failed — it will be confirmed shortly." });
            return;
          }
          setMsg({ ok: true, text: "Payment successful! Your papers are ready in My papers." });
          router.refresh();
        },
      });
      rz.on("payment.failed", () => {
        setBusy(false);
        setMsg({ ok: false, text: "Payment failed. No money was taken — please try again." });
      });
      rz.open();
    } catch (e) {
      setBusy(false);
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong" });
    }
  }

  return (
    <div>
      {askPhone && (
        <label className="mb-2 block text-left">
          <span className="text-xs font-semibold text-ink-soft">Mobile number (needed by the payment gateway, asked once)</span>
          <span className="mt-1 flex items-center overflow-hidden rounded-lg border border-line bg-white focus-within:border-ink">
            <span className="px-2 text-sm text-muted">+91</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10-digit mobile number"
              autoFocus
              className="w-full py-2 pr-2 text-sm outline-none"
            />
          </span>
        </label>
      )}
      <button type="button" onClick={buy} disabled={busy || (askPhone && phone.length !== 10)} className={className ?? "btn btn-primary w-full"}>
        {busy ? "Please wait…" : askPhone ? "Continue to payment" : label}
      </button>
      {msg && (
        <p className={`mt-2 text-xs ${msg.ok ? "font-semibold text-teal" : "text-red-700"}`} role="status">
          {msg.text}
        </p>
      )}
    </div>
  );
}
