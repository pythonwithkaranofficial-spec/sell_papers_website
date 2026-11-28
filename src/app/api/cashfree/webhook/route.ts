import { NextResponse } from "next/server";
import { verifyCashfreeWebhook } from "@/lib/cashfree";
import { fulfilOrder } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/server";

// Cashfree webhook (Cashfree dashboard → Developers → Webhooks → add https://<site>/api/cashfree/webhook).
//   PAYMENT_SUCCESS            → grant access (even if the buyer closed the page before checkout finished)
//   PAYMENT_FAILED             → mark the order failed (shown in the admin panel)
//   PAYMENT_USER_DROPPED       → nothing to do
//   REFUND_STATUS (SUCCESS)    → when the whole amount has been refunded, remove the access it gave
// Orders not created by this website (e.g. another site on the same Cashfree account) are ignored.
type Payload = {
  type?: string;
  data?: {
    order?: { order_id?: string; order_amount?: number };
    payment?: { cf_payment_id?: string | number; payment_status?: string; payment_amount?: number };
    refund?: { order_id?: string; refund_amount?: number; refund_status?: string };
  };
};

export async function POST(req: Request) {
  const raw = await req.text();
  const ok = verifyCashfreeWebhook(raw, req.headers.get("x-webhook-timestamp") || "", req.headers.get("x-webhook-signature") || "");
  if (!ok) return NextResponse.json({ error: "bad signature" }, { status: 400 });

  let event: Payload;
  try {
    event = JSON.parse(raw) as Payload;
  } catch {
    return NextResponse.json({ ok: true });
  }
  const type = (event.type || "").toUpperCase();
  const admin = createAdminClient();

  if (type.startsWith("PAYMENT_SUCCESS")) {
    const orderId = event.data?.order?.order_id;
    if (orderId && event.data?.payment?.payment_status === "SUCCESS") await fulfilOrder(orderId, String(event.data.payment.cf_payment_id ?? ""));
  } else if (type.startsWith("PAYMENT_FAILED")) {
    const orderId = event.data?.order?.order_id;
    // Never downgrade an order that was already paid (a buyer can fail once, then pay successfully).
    if (orderId) await admin.from("orders").update({ status: "failed" }).eq("razorpay_order_id", orderId).eq("status", "created");
  } else if (type.startsWith("REFUND_STATUS") || type.startsWith("AUTO_REFUND_STATUS")) {
    const r = event.data?.refund;
    if (r?.order_id && r.refund_status === "SUCCESS") {
      const { data: order } = await admin.from("orders").select("id,amount_paise").eq("razorpay_order_id", r.order_id).maybeSingle();
      // Full refund only: a partial refund keeps the customer's access.
      if (order && Math.round((r.refund_amount ?? 0) * 100) >= (order.amount_paise as number)) {
        await admin.from("purchases").delete().eq("order_id", order.id);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
