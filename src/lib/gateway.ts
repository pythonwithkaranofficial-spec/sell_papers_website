import "server-only";
import { isCashfreeConfigured } from "./cashfree";
import { isRazorpayConfigured } from "./razorpay";

export type Gateway = "cashfree" | "razorpay";

/**
 * Which payment gateway the shop uses. PAYMENT_PROVIDER ("cashfree" | "razorpay") wins; otherwise Cashfree is used
 * when its keys are set, else Razorpay. Orders keep the gateway's order id in orders.razorpay_order_id
 * (the column name is historical — it holds the Cashfree order id for Cashfree orders).
 */
export function activeGateway(): Gateway | null {
  const wanted = process.env.PAYMENT_PROVIDER?.toLowerCase();
  if (wanted === "cashfree") return isCashfreeConfigured ? "cashfree" : null;
  if (wanted === "razorpay") return isRazorpayConfigured ? "razorpay" : null;
  if (isCashfreeConfigured) return "cashfree";
  if (isRazorpayConfigured) return "razorpay";
  return null;
}
