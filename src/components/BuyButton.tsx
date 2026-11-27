"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
declare global {
  interface Window {
    Razorpay?: new (o: RazorpayOptions) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

function loadCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  checkoutLoading ??= new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => {
      checkoutLoading = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return checkoutLoading;
}

let checkoutLoading: Promise<boolean> | null = null;

export function BuyButton({ type, paperId, subjectId, label, className, signedIn, returnTo }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Load Razorpay's checkout script in the background so the payment window opens instantly on click.
  useEffect(() => {
    if (!signedIn) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => void loadCheckout());
    else setTimeout(() => void loadCheckout(), 1500);
  }, [signedIn]);

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
        body: JSON.stringify({ type, paperId, subjectId }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Could not start payment");
      if (!(await loadCheckout()) || !window.Razorpay) throw new Error("Could not load Razorpay. Check your connection.");
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
          const v = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(r),
          });
          const out = await v.json();
          setBusy(false);
          if (!v.ok) {
            setMsg(out.error || "Payment received but verification failed — it will be confirmed shortly.");
            return;
          }
          setMsg("Payment successful! Your papers are ready.");
          router.refresh();
        },
      });
      rz.on("payment.failed", () => {
        setBusy(false);
        setMsg("Payment failed. No money was taken — please try again.");
      });
      rz.open();
    } catch (e) {
      setBusy(false);
      setMsg(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div>
      <button type="button" onClick={buy} disabled={busy} className={className ?? "btn btn-primary w-full"}>
        {busy ? "Please wait…" : label}
      </button>
      {msg && <p className="mt-2 text-xs text-muted" role="status">{msg}</p>}
    </div>
  );
}
