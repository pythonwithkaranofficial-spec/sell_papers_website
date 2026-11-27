import { NextResponse } from "next/server";
import { fulfilOrder } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/server";

// Razorpay webhook (Dashboard → Account & Settings → Webhooks). Handled events:
//   payment.captured, order.paid  → grant access (even if the buyer closed the tab before checkout finished)
//   payment.failed                → mark the order as failed (shown in the admin dashboard)
//   refund.processed              → when the whole payment has been refunded, remove the access it gave
//   refund.created, refund.failed → nothing to change here (the admin Payments tab reads refunds from Razorpay)
type PaymentEntity = { id: string; order_id: string | null; status: string; amount: number; amount_refunded?: number; refund_status?: string | null };

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: "bad signature" }, { status: 400 });

  const event = JSON.parse(raw) as { event: string; payload?: { payment?: { entity?: PaymentEntity } } };
  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id;

  if ((event.event === "payment.captured" || event.event === "order.paid") && payment && orderId) {
    await fulfilOrder(orderId, payment.id);
  } else if (event.event === "payment.failed" && orderId) {
    // Never downgrade an order that was already paid (a buyer can fail once, then pay successfully).
    await createAdminClient().from("orders").update({ status: "failed" }).eq("razorpay_order_id", orderId).eq("status", "created");
  } else if (event.event === "refund.processed" && payment && orderId) {
    const fullyRefunded = payment.refund_status === "full" || (payment.amount_refunded ?? 0) >= payment.amount;
    if (fullyRefunded) {
      const admin = createAdminClient();
      const { data: order } = await admin.from("orders").select("id").eq("razorpay_order_id", orderId).maybeSingle();
      if (order) await admin.from("purchases").delete().eq("order_id", order.id);
    }
  }
  return NextResponse.json({ ok: true });
}
