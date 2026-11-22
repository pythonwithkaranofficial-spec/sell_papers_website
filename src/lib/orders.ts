import "server-only";
import { createAdminClient } from "./supabase/server";

/**
 * Marks an order paid and grants access. Idempotent: safe to call from both the checkout
 * verification route and the Razorpay webhook.
 */
export async function fulfilOrder(razorpayOrderId: string, razorpayPaymentId: string) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id,user_id,item_type,paper_id,subject_id,status")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();
  if (!order) return { ok: false as const, reason: "order not found" };
  if (order.status !== "paid") {
    await admin
      .from("orders")
      .update({ status: "paid", razorpay_payment_id: razorpayPaymentId, paid_at: new Date().toISOString() })
      .eq("id", order.id);
  }
  const grant: { user_id: string; order_id: string; subject_id: string | null; paper_id: string | null } = {
    user_id: order.user_id,
    order_id: order.id,
    subject_id: order.item_type === "subject" ? order.subject_id : null,
    paper_id: order.item_type === "subject" ? null : order.paper_id,
  };
  const { error } = await admin.from("purchases").insert(grant);
  if (error && error.code !== "23505") return { ok: false as const, reason: error.message }; // 23505 = already granted
  return { ok: true as const, order };
}
