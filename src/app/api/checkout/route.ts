import { NextResponse } from "next/server";
import { subjectById } from "@/lib/catalog";
import { isRazorpayConfigured, razorpay, razorpayKeyId } from "@/lib/razorpay";
import { site } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createAdminClient, getUser } from "@/lib/supabase/server";

// Creates a Razorpay order for one set or a whole-subject bundle. The price always comes from the database.
export async function POST(req: Request) {
  if (!isSupabaseConfigured || !isRazorpayConfigured)
    return NextResponse.json({ error: "Payments are not set up yet. Please try again soon." }, { status: 503 });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to buy." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { type?: string; paperId?: string; subjectId?: string };
  const admin = createAdminClient();
  let amount = 0;
  let description = "";
  const row: Record<string, unknown> = { user_id: user.id };

  if (body.type === "paper" && body.paperId) {
    const { data: paper } = await admin
      .from("papers")
      .select("id,subject_id,set_no,title,price_paise,is_published,paper_files(kind)")
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
    description = `${subjectById(paper.subject_id)?.name ?? "Paper"} — ${paper.title}`;
    Object.assign(row, { item_type: "paper", paper_id: paper.id });
  } else if (body.type === "subject" && body.subjectId) {
    const { data: subj } = await admin
      .from("subjects")
      .select("id,name,class_level,bundle_price_paise,is_bundle_on_sale")
      .eq("id", body.subjectId)
      .maybeSingle();
    if (!subj || !subj.is_bundle_on_sale) return NextResponse.json({ error: "Bundle not available." }, { status: 404 });
    const { data: owned } = await admin
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("subject_id", subj.id)
      .limit(1);
    if (owned?.length) return NextResponse.json({ error: "You already own this bundle." }, { status: 409 });
    amount = subj.bundle_price_paise;
    description = `Class ${subj.class_level} ${subj.name} — all sets`;
    Object.assign(row, { item_type: "subject", subject_id: subj.id });
  } else {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { data: dbOrder, error } = await admin
    .from("orders")
    .insert({ ...row, amount_paise: amount, currency: "INR" })
    .select("id")
    .single();
  if (error || !dbOrder) return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });

  const rzOrder = await razorpay().orders.create({
    amount,
    currency: "INR",
    receipt: dbOrder.id.slice(0, 40),
    notes: { order_db_id: dbOrder.id, user_id: user.id },
  });
  await admin.from("orders").update({ razorpay_order_id: rzOrder.id }).eq("id", dbOrder.id);

  return NextResponse.json({
    keyId: razorpayKeyId,
    orderId: rzOrder.id,
    amount,
    currency: "INR",
    name: site.name,
    description,
    email: user.email ?? "",
  });
}
