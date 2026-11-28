import "server-only";
import type { User } from "@supabase/supabase-js";
import { setTitle, subjectById } from "./catalog";
import { cashfreeMode, getCashfreePayments, getCashfreeRefunds, isCashfreeConfigured } from "./cashfree";
import { activeGateway } from "./gateway";
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

/** Which gateway the admin Payments tab reads, and whether it is real money. */
export function paymentsSource() {
  const gateway = activeGateway();
  const live = gateway === "cashfree" ? cashfreeMode === "production" : razorpayKeyId.startsWith("rzp_live_");
  return { gateway, live, name: gateway === "cashfree" ? "Cashfree" : "Razorpay" };
}

/**
 * Payments and refunds from Razorpay that belong to THIS website, joined to our orders and customers.
 * A Razorpay account can serve several websites, so only payments for orders created here are kept.
 */
export async function getPaymentsReport(admin: AdminClient, users: User[]) {
  return activeGateway() === "cashfree" ? getCashfreeReport(admin, users) : getRazorpayReport(admin, users);
}

async function getRazorpayReport(admin: AdminClient, users: User[], maxOrders = 1000) {
  if (!isRazorpayConfigured) return { configured: false as const };

  // Our own orders (newest first) — these define which Razorpay payments are ours.
  const { data: orderData, error: orderErr } = await admin
    .from("orders")
    .select("razorpay_order_id,user_id,item_type,subject_id,created_at,papers(set_no,subject_id)")
    .not("razorpay_order_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(maxOrders);
  if (orderErr) return { configured: true as const, error: orderErr.message };
  const orders = (orderData ?? []) as { razorpay_order_id: string; user_id: string; item_type: string; subject_id: string | null; created_at: string; papers: unknown }[];
  if (!orders.length) return { configured: true as const, payments: [] as PaymentRow[], refunds: [] as RefundRow[] };
  const ours = new Set(orders.map((o) => o.razorpay_order_id));
  // Only ask Razorpay for payments made since our oldest listed order (a minute of slack).
  const from = Math.floor(Math.min(...orders.map((o) => new Date(o.created_at).getTime())) / 1000) - 60;

  const rzp = razorpay();
  const payments: RzpPayment[] = [];
  const refunds: RzpRefund[] = [];
  try {
    for (let skip = 0; skip < 5000; skip += 100) {
      const page = (await rzp.payments.all({ from, count: 100, skip })) as unknown as { items: RzpPayment[] };
      payments.push(...page.items.filter((p) => p.order_id && ours.has(p.order_id)));
      if (page.items.length < 100) break;
    }
    const ourPayments = new Set(payments.map((p) => p.id));
    for (let skip = 0; skip < 5000; skip += 100) {
      const page = (await rzp.refunds.all({ from, count: 100, skip })) as unknown as { items: RzpRefund[] };
      refunds.push(...page.items.filter((r) => ourPayments.has(r.payment_id)));
      if (page.items.length < 100) break;
    }
  } catch (e) {
    const err = e as { error?: { description?: string }; message?: string };
    return { configured: true as const, error: err.error?.description || err.message || "Could not reach Razorpay" };
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


/**
 * Cashfree has no "list every payment" call, so this reads the latest orders made on THIS website from our database
 * and asks Cashfree for each order's payments (and refunds for paid orders). Other websites never appear.
 */
async function getCashfreeReport(admin: AdminClient, users: User[], maxOrders = 80) {
  if (!isCashfreeConfigured) return { configured: false as const };
  const { data, error } = await admin
    .from("orders")
    .select("razorpay_order_id,user_id,item_type,subject_id,status,amount_paise,created_at,papers(set_no,subject_id)")
    .not("razorpay_order_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(maxOrders);
  if (error) return { configured: true as const, error: error.message };
  const orders = (data ?? []) as {
    razorpay_order_id: string; user_id: string; item_type: string; subject_id: string | null; status: string; amount_paise: number; created_at: string; papers: unknown;
  }[];
  const { data: profiles } = await admin.from("profiles").select("id,full_name,phone").limit(20000);
  const prof = new Map((profiles ?? []).map((x) => [x.id as string, x]));
  const emailOf = new Map(users.map((u) => [u.id, u.email ?? null]));
  const describe = (o: (typeof orders)[number]) => {
    const pp = o.papers as { set_no: number; subject_id: string } | null;
    const subj = subjectById(o.subject_id ?? pp?.subject_id ?? "");
    if (o.item_type === "subject") return `${subj?.name ?? o.subject_id} — all 30 sets`;
    return subj && pp ? setTitle(subj, pp.set_no) : "Set";
  };
  const STATUS: Record<string, string> = { SUCCESS: "captured", FAILED: "failed" };

  const rows: PaymentRow[] = [];
  const refundRows: RefundRow[] = [];
  try {
    for (let i = 0; i < orders.length; i += 6) {
      await Promise.all(
        orders.slice(i, i + 6).map(async (o) => {
          const id = o.razorpay_order_id;
          const pr = prof.get(o.user_id);
          const base = {
            orderId: id,
            userEmail: emailOf.get(o.user_id) ?? null,
            userName: (pr?.full_name as string | null) ?? null,
            rzpEmail: "",
            rzpContact: (pr?.phone as string | null) ?? "",
            item: describe(o),
          };
          const payments = await getCashfreePayments(id).catch(() => []);
          const refunds = o.status === "paid" ? await getCashfreeRefunds(id).catch(() => []) : [];
          const refunded = refunds.filter((r) => r.refund_status === "SUCCESS").reduce((n, r) => n + Math.round(r.refund_amount * 100), 0);
          for (const r of refunds) {
            refundRows.push({
              id: r.refund_id,
              paymentId: String(r.cf_payment_id ?? ""),
              amount: Math.round(r.refund_amount * 100),
              // map to the same words the page already shows
              status: r.refund_status === "SUCCESS" ? "processed" : r.refund_status === "CANCELLED" || r.refund_status === "REJECTED" ? "failed" : "pending",
              createdAt: r.created_at ? Math.floor(new Date(r.created_at).getTime() / 1000) : 0,
              userEmail: base.userEmail,
              item: base.item,
            });
          }
          if (!payments.length) {
            rows.push({ ...base, id, createdAt: Math.floor(new Date(o.created_at).getTime() / 1000), amount: o.amount_paise, status: "created",
              refundStatus: null, amountRefunded: 0, method: "", error: null });
            return;
          }
          for (const pay of payments) {
            const success = pay.payment_status === "SUCCESS";
            rows.push({
              ...base,
              id: String(pay.cf_payment_id),
              createdAt: Math.floor(new Date(pay.payment_time || o.created_at).getTime() / 1000),
              amount: Math.round(pay.payment_amount * 100),
              status: STATUS[pay.payment_status] ?? "created",
              refundStatus: success && refunded > 0 ? (refunded >= o.amount_paise ? "full" : "partial") : null,
              amountRefunded: success ? refunded : 0,
              method: (pay.payment_group || "").replace(/_/g, " "),
              error: pay.payment_status === "FAILED" ? pay.error_details?.error_description || pay.payment_message || null : null,
            });
          }
        }),
      );
    }
  } catch (e) {
    return { configured: true as const, error: e instanceof Error ? e.message : "Could not reach Cashfree" };
  }
  rows.sort((a, b) => b.createdAt - a.createdAt);
  refundRows.sort((a, b) => b.createdAt - a.createdAt);
  return { configured: true as const, payments: rows, refunds: refundRows };
}
