import "server-only";
import crypto from "node:crypto";

// Cashfree Payment Gateway (https://www.cashfree.com/docs). Server-side only: the secret key never reaches the browser.
const appId = process.env.CASHFREE_APP_ID || "";
const secretKey = process.env.CASHFREE_SECRET_KEY || "";
/** "sandbox" (test keys) or "production" (live keys). */
export const cashfreeMode: "sandbox" | "production" = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
export const isCashfreeConfigured = Boolean(appId && secretKey);

const BASE = cashfreeMode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
const API_VERSION = "2025-01-01";

async function cf<T>(path: string, init: { method?: string; body?: unknown; idempotencyKey?: string } = {}): Promise<T> {
  if (!isCashfreeConfigured) throw new Error("Cashfree keys are not configured");
  const res = await fetch(BASE + path, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secretKey,
      ...(init.idempotencyKey ? { "x-idempotency-key": init.idempotencyKey } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || `Cashfree error ${res.status}`);
  return data as T;
}

export type CfOrder = { order_id: string; order_status: string; order_amount: number; payment_session_id?: string; cf_order_id?: string | number };
export type CfPayment = {
  cf_payment_id: string | number;
  order_id: string;
  payment_status: string; // SUCCESS | FAILED | USER_DROPPED | NOT_ATTEMPTED | PENDING | VOID | CANCELLED
  payment_amount: number;
  payment_message?: string | null;
  payment_time?: string | null;
  payment_group?: string | null; // upi | credit_card | debit_card | net_banking | wallet …
  error_details?: { error_description?: string | null; error_reason?: string | null } | null;
};
export type CfRefund = { refund_id: string; order_id: string; cf_payment_id?: string | number; refund_amount: number; refund_status: string; created_at?: string };

export function createCashfreeOrder(input: {
  orderId: string;
  amountPaise: number;
  customerId: string;
  phone: string;
  email?: string | null;
  name?: string | null;
  note?: string;
}) {
  return cf<CfOrder>("/orders", {
    method: "POST",
    idempotencyKey: crypto.randomUUID(),
    body: {
      order_id: input.orderId,
      order_amount: Number((input.amountPaise / 100).toFixed(2)),
      order_currency: "INR",
      order_note: input.note?.slice(0, 200),
      customer_details: {
        customer_id: input.customerId,
        customer_phone: input.phone,
        ...(input.email ? { customer_email: input.email } : {}),
        ...(input.name && input.name.length >= 3 ? { customer_name: input.name.slice(0, 100) } : {}),
      },
    },
  });
}

export const getCashfreeOrder = (orderId: string) => cf<CfOrder>(`/orders/${encodeURIComponent(orderId)}`);
export const getCashfreePayments = (orderId: string) => cf<CfPayment[]>(`/orders/${encodeURIComponent(orderId)}/payments`);
export const getCashfreeRefunds = (orderId: string) => cf<CfRefund[]>(`/orders/${encodeURIComponent(orderId)}/refunds`);

/** Webhook check: base64(HMAC-SHA256(timestamp + rawBody, secret key)). */
export function verifyCashfreeWebhook(rawBody: string, timestamp: string, signature: string) {
  if (!secretKey || !timestamp || !signature) return false;
  const expected = crypto.createHmac("sha256", secretKey).update(timestamp + rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Cashfree customer_id: alphanumeric only, 3–50 characters. */
export const cashfreeCustomerId = (userId: string) => userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 50);

/** Indian mobile number as 10 digits (accepts +91 / 0 prefixes), or null. */
export function normalisePhone(raw: unknown) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}
