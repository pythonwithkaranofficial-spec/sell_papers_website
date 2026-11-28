import { NextResponse } from "next/server";
import { setTitle, subjectById } from "@/lib/catalog";
import { cashfreeCustomerId, cashfreeMode, createCashfreeOrder, normalisePhone } from "@/lib/cashfree";
import { activeGateway } from "@/lib/gateway";
import { razorpay, razorpayKeyId } from "@/lib/razorpay";
import { site } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createAdminClient, getUser } from "@/lib/supabase/server";

// Creates an order for one set or a whole-subject bundle with the active payment gateway (Cashfree or Razorpay).
// The price always comes from the database, never from the browser.
export async function POST(req: Request) {
  const gateway = activeGateway();
  if (!isSupabaseConfigured || !gateway)
    return NextResponse.json({ error: "Payments are not set up yet. Please try again soon." }, { status: 503 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to buy." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { type?: string; paperId?: string; subjectId?: string; phone?: string };
  const admin = createAdminClient();
  let amount = 0;
  let description = "";
  const row: Record<string, unknown> = { user_id: user.id };

  if (body.type === "paper" && body.paperId) {
    const { data: paper } = await admin
      .from("papers")
      .select("id,subject_id,set_no,price_paise,is_published,paper_files(kind)")
      .eq("id", body.paperId)
      .maybeSingle();
    if (!paper || !paper.is_published || !(paper.paper_files as unknown[])?.length)
      return NextResponse.json({ error: "This set is not available yet." }, { status: 404 });
    const { data: owned } = await admin
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .or(`paper_id.eq.${paper.id},subject_id.eq.${paper.subject_id}`)
      .limit(1);
    if (owned?.length) return NextResponse.json({ error: "You already own this set." }, { status: 409 });
    amount = paper.price_paise;
    const subject = subjectById(paper.subject_id);
    description = subject ? setTitle(subject, paper.set_no) : `Set ${paper.set_no}`;
    Object.assign(row, { item_type: "paper", paper_id: paper.id });
  } else if (body.type === "subject" && body.subjectId) {
    const { data: subj } = await admin
      .from("subjects")
      .select("id,name,class_level,bundle_price_paise,is_bundle_on_sale")
      .eq("id", body.subjectId)
      .maybeSingle();
    if (!subj || !subj.is_bundle_on_sale) return NextResponse.json({ error: "Bundle not available." }, { status: 404 });
    const { data: owned } = await admin.from("purchases").select("id").eq("user_id", user.id).eq("subject_id", subj.id).limit(1);
    if (owned?.length) return NextResponse.json({ error: "You already own this bundle." }, { status: 409 });
    amount = subj.bundle_price_paise;
    description = `Class ${subj.class_level} ${subjectById(subj.id)?.name ?? subj.name} — all sets`;
    Object.assign(row, { item_type: "subject", subject_id: subj.id });
  } else {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Cashfree needs the buyer's mobile number. Ask once, then remember it on the profile.
  let phone: string | null = null;
  let fullName: string | null = null;
  if (gateway === "cashfree") {
    const { data: profile } = await admin.from("profiles").select("phone,full_name").eq("id", user.id).maybeSingle();
    fullName = (profile?.full_name as string | null) ?? null;
    phone = normalisePhone(body.phone) ?? normalisePhone(profile?.phone);
    if (!phone)
      return NextResponse.json(
        { needPhone: true, error: body.phone ? "Please enter a valid 10-digit Indian mobile number." : "Mobile number needed for payment." },
        { status: 400 },
      );
    if (phone !== profile?.phone) await admin.from("profiles").upsert({ id: user.id, phone }, { onConflict: "id" });
  }

  const { data: dbOrder, error } = await admin.from("orders").insert({ ...row, amount_paise: amount, currency: "INR" }).select("id").single();
  if (error || !dbOrder) return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });

  if (gateway === "cashfree") {
    try {
      const cfOrder = await createCashfreeOrder({
        orderId: dbOrder.id,
        amountPaise: amount,
        customerId: cashfreeCustomerId(user.id),
        phone: phone!,
        email: user.email,
        name: fullName,
        note: description,
      });
      await admin.from("orders").update({ razorpay_order_id: cfOrder.order_id }).eq("id", dbOrder.id);
      return NextResponse.json({
        gateway: "cashfree",
        mode: cashfreeMode,
        orderId: cfOrder.order_id,
        paymentSessionId: cfOrder.payment_session_id,
      });
    } catch (e) {
      await admin.from("orders").update({ status: "failed" }).eq("id", dbOrder.id);
      return NextResponse.json({ error: e instanceof Error ? `Could not start payment: ${e.message}` : "Could not start payment." }, { status: 502 });
    }
  }

  const rzOrder = await razorpay().orders.create({
    amount,
    currency: "INR",
    receipt: dbOrder.id.slice(0, 40),
    notes: { order_db_id: dbOrder.id, user_id: user.id },
  });
  await admin.from("orders").update({ razorpay_order_id: rzOrder.id }).eq("id", dbOrder.id);

  return NextResponse.json({
    gateway: "razorpay",
    keyId: razorpayKeyId,
    orderId: rzOrder.id,
    amount,
    currency: "INR",
    name: site.name,
    description,
    email: user.email ?? "",
  });
}
