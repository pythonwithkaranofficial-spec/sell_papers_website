import { NextResponse } from "next/server";
import { fulfilOrder } from "@/lib/orders";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { createAdminClient, getUser } from "@/lib/supabase/server";

// Called by the browser after Razorpay Checkout succeeds; grants access once the signature checks out.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  if (!b.razorpay_order_id || !b.razorpay_payment_id || !b.razorpay_signature)
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  if (!verifyPaymentSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature))
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });

  const { data: order } = await createAdminClient()
    .from("orders")
    .select("user_id")
    .eq("razorpay_order_id", b.razorpay_order_id)
    .maybeSingle();
  if (!order || order.user_id !== user.id) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const res = await fulfilOrder(b.razorpay_order_id, b.razorpay_payment_id);
  if (!res.ok) return NextResponse.json({ error: res.reason }, { status: 500 });
  return NextResponse.json({ ok: true });
}
