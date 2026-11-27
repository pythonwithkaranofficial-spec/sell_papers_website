import "server-only";
import type { User } from "@supabase/supabase-js";
import { setTitle, subjectById } from "./catalog";
import { isRazorpayConfigured, razorpay, razorpayKeyId } from "./razorpay";
import { createAdminClient } from "./supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;

export type PaymentRow = {
  id: string;
  createdAt: number; // unix seconds
  amount: number; // paise
  status: string; // captured | authorized | failed | refunded | created
  refundStatus: string | null; // partial | full
  amountRefunded: number;
  method: string;
  rzpEmail: string;
  rzpContact: string;
  error: string | null;
  orderId: string | null;
  userEmail: string | null;
  userName: string | null;
  item: string | null;
};

export type RefundRow = { id: string; paymentId: string; amount: number; status: string; createdAt: number; userEmail: string | null; item: string | null };

type RzpPayment = {
  id: string;
  amount: number;
  status: string;
  refund_status: string | null;
  amount_refunded?: number;
  method: string;
  email?: string;
  contact?: string | number;
  error_description: string | null;
  order_id: string | null;
  created_at: number;
};
type RzpRefund = { id: string; payment_id: string; amount: number; status: string; created_at: number };

export const isLiveMode = razorpayKeyId.startsWith("rzp_live_");

/** Latest payments and refunds straight from Razorpay, joined to our orders and customer accounts. */
export async function getPaymentsReport(admin: AdminClient, users: User[], limit = 300) {
  if (!isRazorpayConfigured) return { configured: false as const };
  const rzp = razorpay();
  const payments: RzpPayment[] = [];
  const refunds: RzpRefund[] = [];
  try {
    for (let skip = 0; skip < limit; skip += 100) {
      const page = (await rzp.payments.all({ count: 100, skip })) as unknown as { items: RzpPayment[] };
      payments.push(...page.items);
      if (page.items.length < 100) break;
    }
    for (let skip = 0; skip < limit; skip += 100) {
      const page = (await rzp.refunds.all({ count: 100, skip })) as unknown as { items: RzpRefund[] };
      refunds.push(...page.items);
      if (page.items.length < 100) break;
    }
  } catch (e) {
    const err = e as { error?: { description?: string }; message?: string };
    return { configured: true as const, error: err.error?.description || err.message || "Could not reach Razorpay" };
  }

  // Link each Razorpay payment to our order (item + customer account).
  const orderIds = [...new Set(payments.map((p) => p.order_id).filter(Boolean))] as string[];
  const orders: { razorpay_order_id: string; user_id: string; item_type: string; subject_id: string | null; papers: unknown }[] = [];
  for (let i = 0; i < orderIds.length; i += 200) {
    const { data } = await admin
      .from("orders")
      .select("razorpay_order_id,user_id,item_type,subject_id,papers(set_no,subject_id)")
      .in("razorpay_order_id", orderIds.slice(i, i + 200));
    orders.push(...((data ?? []) as typeof orders));
  }
  const { data: profiles } = await admin.from("profiles").select("id,full_name").limit(20000);
  const nameOf = new Map((profiles ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? null]));
  const emailOf = new Map(users.map((u) => [u.id, u.email ?? null]));
  const orderOf = new Map(orders.map((o) => [o.razorpay_order_id, o]));

  const describe = (o: (typeof orders)[number] | undefined) => {
    if (!o) return null;
    const p = o.papers as { set_no: number; subject_id: string } | null;
    const subj = subjectById(o.subject_id ?? p?.subject_id ?? "");
    if (o.item_type === "subject") return `${subj?.name ?? o.subject_id} — all 30 sets`;
    return subj && p ? setTitle(subj, p.set_no) : "Set";
  };

  const rows: PaymentRow[] = payments.map((p) => {
    const o = p.order_id ? orderOf.get(p.order_id) : undefined;
    return {
      id: p.id,
      createdAt: p.created_at,
      amount: p.amount,
      status: p.status,
      refundStatus: p.refund_status && p.refund_status !== "null" ? p.refund_status : null,
      amountRefunded: p.amount_refunded ?? 0,
      method: p.method,
      rzpEmail: p.email ?? "",
      rzpContact: p.contact ? String(p.contact) : "",
      error: p.error_description,
      orderId: p.order_id,
      userEmail: o ? emailOf.get(o.user_id) ?? null : null,
      userName: o ? nameOf.get(o.user_id) ?? null : null,
      item: describe(o),
    };
  });
  const byPayment = new Map(rows.map((r) => [r.id, r]));
  const refundRows: RefundRow[] = refunds.map((r) => ({
    id: r.id,
    paymentId: r.payment_id,
    amount: r.amount,
    status: r.status,
    createdAt: r.created_at,
    userEmail: byPayment.get(r.payment_id)?.userEmail ?? byPayment.get(r.payment_id)?.rzpEmail ?? null,
    item: byPayment.get(r.payment_id)?.item ?? null,
  }));
  return { configured: true as const, payments: rows, refunds: refundRows };
}
