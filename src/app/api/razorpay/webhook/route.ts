import { NextResponse } from "next/server";
import { fulfilOrder } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Razorpay webhook (Dashboard → Settings → Webhooks): events "payment.captured" and "order.paid".
// Grants access even if the buyer closes the tab before the browser verification call completes.
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: "bad signature" }, { status: 400 });

  const event = JSON.parse(raw) as {
    event: string;
    payload?: { payment?: { entity?: { id: string; order_id: string; status: string } } };
  };
  const payment = event.payload?.payment?.entity;
  if ((event.event === "payment.captured" || event.event === "order.paid") && payment?.order_id) {
    await fulfilOrder(payment.order_id, payment.id);
  }
  return NextResponse.json({ ok: true });
}
