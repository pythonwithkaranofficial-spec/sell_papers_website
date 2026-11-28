import { NextResponse } from "next/server";
import { getCashfreeOrder, getCashfreePayments } from "@/lib/cashfree";
import { fulfilOrder } from "@/lib/orders";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { createAdminClient, getUser } from "@/lib/supabase/server";

// Called by the browser after checkout closes. Access is granted only after the payment is confirmed:
//  • Razorpay — by checking Razorpay's signature;
//  • Cashfree — by asking Cashfree's servers whether the order is PAID.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as {
    gateway?: string;
    orderId?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  const admin = createAdminClient();
  const ownOrder = async (gatewayOrderId: string) => {
    const { data } = await admin.from("orders").select("user_id,status").eq("razorpay_order_id", gatewayOrderId).maybeSingle();
    return data && data.user_id === user.id ? data : null;
  };

  if (b.gateway === "cashfree") {
    if (!b.orderId) return NextResponse.json({ error: "Missing order." }, { status: 400 });
    if (!(await ownOrder(b.orderId))) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    try {
      const order = await getCashfreeOrder(b.orderId);
      if (order.order_status !== "PAID") {
        const payments = await getCashfreePayments(b.orderId).catch(() => []);
        const last = payments[0];
        if (last?.payment_status === "FAILED") await admin.from("orders").update({ status: "failed" }).eq("razorpay_order_id", b.orderId).eq("status", "created");
        return NextResponse.json(
          { ok: false, status: last?.payment_status ?? order.order_status, error: last?.payment_status === "FAILED" ? "Payment failed. No money was taken — please try again." : "Payment not completed." },
          { status: 402 },
        );
      }
      const payments = await getCashfreePayments(b.orderId);
      const paid = payments.find((p) => p.payment_status === "SUCCESS");
      const res = await fulfilOrder(b.orderId, String(paid?.cf_payment_id ?? ""));
      if (!res.ok) return NextResponse.json({ error: res.reason }, { status: 500 });
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Could not check the payment." }, { status: 502 });
    }
  }

  if (!b.razorpay_order_id || !b.razorpay_payment_id || !b.razorpay_signature)
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  if (!verifyPaymentSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature))
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  if (!(await ownOrder(b.razorpay_order_id))) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const res = await fulfilOrder(b.razorpay_order_id, b.razorpay_payment_id);
  if (!res.ok) return NextResponse.json({ error: res.reason }, { status: 500 });
  return NextResponse.json({ ok: true });
}
