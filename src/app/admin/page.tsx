import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSetRow, AdminSubjectPrice } from "@/components/AdminControls";
import { AccessManager, AdminManager, BulkPricing, type PriceRow } from "@/components/AdminTools";
import { isOwner, listAllUsers, ownerEmails } from "@/lib/admin";
import { CLASSES, SUBJECTS, setTitle, subjectById, subjectsFor } from "@/lib/catalog";
import { getPaymentsReport, isLiveMode } from "@/lib/payments";
import { formatINR } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createAdminClient, getUser, isAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "payments", label: "Payments" },
  { key: "customers", label: "Customers" },
  { key: "prices", label: "Prices (bulk)" },
  { key: "papers", label: "Papers & files" },
  { key: "access", label: "Customer access" },
  { key: "admins", label: "Admins" },
] as const;
type Tab = (typeof TABS)[number]["key"];

type Admin = ReturnType<typeof createAdminClient>;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; subject?: string; status?: string; email?: string }> }) {
  if (!isSupabaseConfigured) return <Notice text="Connect Supabase (see README) to use the admin panel." />;
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  if (!(await isAdmin(user))) return <Notice text="This page is only for administrators." />;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return <Notice text="Add SUPABASE_SERVICE_ROLE_KEY to the environment to manage papers." />;

  const params = await searchParams;
  const tab: Tab = (TABS.find((t) => t.key === params.tab)?.key ?? "dashboard") as Tab;
  const admin = createAdminClient();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin panel</p>
          <h1 className="font-display mt-1 text-3xl font-semibold">{TABS.find((t) => t.key === tab)?.label}</h1>
        </div>
        <p className="text-sm text-muted">
          Signed in as <strong className="text-ink">{user.email}</strong> · {isOwner(user) ? "Owner" : "Admin"}
        </p>
      </div>
      <nav className="mt-6 flex gap-1 overflow-x-auto rounded-full bg-paper-deep p-1 text-sm" aria-label="Admin sections">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold ${t.key === tab ? "bg-white shadow-sm" : "text-muted hover:text-ink"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">
        {tab === "dashboard" && <Dashboard admin={admin} />}
        {tab === "payments" && <Payments admin={admin} status={params.status} />}
        {tab === "customers" && <Customers admin={admin} />}
        {tab === "prices" && <Prices admin={admin} />}
        {tab === "papers" && <Papers admin={admin} subjectId={params.subject} />}
        {tab === "access" && (
          <AccessManager initialEmail={params.email ?? ""} subjects={SUBJECTS.map((s) => ({ id: s.id, label: `Class ${s.classLevel} · ${s.name}` }))} />
        )}
        {tab === "admins" && <Admins admin={admin} me={user.email ?? ""} canManage={isOwner(user)} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ dashboard */

async function Dashboard({ admin }: { admin: Admin }) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const monthStart = new Date(since.getFullYear(), since.getMonth(), 1);
  const [{ data: paid }, { count: customers }, { count: onSale }, { data: recent }, users] = await Promise.all([
    admin.from("orders").select("amount_paise,paid_at").eq("status", "paid").limit(20000),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("papers").select("id", { count: "exact", head: true }).eq("is_published", true),
    admin
      .from("orders")
      .select("id,user_id,item_type,paper_id,subject_id,amount_paise,status,created_at,papers(set_no,subject_id)")
      .order("created_at", { ascending: false })
      .limit(25),
    listAllUsers(admin).catch(() => []),
  ]);
  const emailOf = new Map(users.map((u) => [u.id, u.email ?? ""]));
  const sum = (rows: { amount_paise: number }[]) => rows.reduce((n, r) => n + r.amount_paise, 0);
  const all = (paid ?? []) as { amount_paise: number; paid_at: string | null }[];
  const today = all.filter((o) => o.paid_at && new Date(o.paid_at) >= since);
  const month = all.filter((o) => o.paid_at && new Date(o.paid_at) >= monthStart);

  const stats = [
    ["Total sales", formatINR(sum(all)), `${all.length} paid orders`],
    ["This month", formatINR(sum(month)), `${month.length} orders`],
    ["Today", formatINR(sum(today)), `${today.length} orders`],
    ["Customers", String(customers ?? 0), "accounts created"],
    ["Sets on sale", `${onSale ?? 0} / ${SUBJECTS.length * 30}`, "across all subjects"],
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(([label, value, note]) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
            <p className="font-display mt-2 text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-muted">{note}</p>
          </div>
        ))}
      </div>
      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="font-display text-xl font-semibold">Latest orders</h2>
          <span className="text-xs text-muted">Full payment details are in your Razorpay dashboard</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Item</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(recent ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted">No orders yet.</td>
                </tr>
              )}
              {(recent ?? []).map((o) => {
                const p = o.papers as unknown as { set_no: number; subject_id: string } | null;
                const subj = subjectById((o.subject_id as string) ?? p?.subject_id ?? "");
                const item = o.item_type === "subject" ? `${subj?.name ?? o.subject_id} — all sets` : subj && p ? setTitle(subj, p.set_no) : "Set";
                const status = o.status as string;
                return (
                  <tr key={o.id as string} className="border-t border-line">
                    <td className="whitespace-nowrap p-3 text-muted">
                      {new Date(o.created_at as string).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="p-3">{emailOf.get(o.user_id as string) || "—"}</td>
                    <td className="p-3">{item}</td>
                    <td className="p-3">{formatINR(o.amount_paise as number)}</td>
                    <td className="p-3">
                      <span
                        className={`chip ${
                          status === "paid" ? "bg-teal-soft text-teal" : status === "failed" ? "bg-red-50 text-red-700" : "bg-paper-deep text-muted"
                        }`}
                      >
                        {status === "created" ? "not paid" : status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ payments */

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "success", label: "Successful" },
  { key: "failed", label: "Failed" },
  { key: "refunded", label: "Refunded" },
  { key: "pending", label: "Not completed" },
] as const;

function paymentBadge(status: string, refundStatus: string | null) {
  if (refundStatus === "full") return ["Refunded", "bg-paper-deep text-ink-soft"];
  if (refundStatus === "partial") return ["Part refunded", "bg-paper-deep text-ink-soft"];
  if (status === "captured") return ["Successful", "bg-teal-soft text-teal"];
  if (status === "failed") return ["Failed", "bg-red-50 text-red-700"];
  if (status === "authorized") return ["Authorised (not captured)", "bg-gold-soft text-gold"];
  return [status, "bg-paper-deep text-muted"];
}

async function Payments({ admin, status }: { admin: Admin; status?: string }) {
  const users = await listAllUsers(admin).catch(() => []);
  const [report, { data: paidOrders }] = await Promise.all([
    getPaymentsReport(admin, users),
    admin.from("orders").select("item_type,subject_id,amount_paise,papers(set_no,subject_id)").eq("status", "paid").limit(20000),
  ]);

  // Sales by item, from our own paid orders.
  const sales = new Map<string, { item: string; count: number; revenue: number }>();
  for (const o of paidOrders ?? []) {
    const pp = o.papers as unknown as { set_no: number; subject_id: string } | null;
    const subj = subjectById((o.subject_id as string) ?? pp?.subject_id ?? "");
    const item = o.item_type === "subject" ? `${subj?.name ?? o.subject_id} — all 30 sets` : subj && pp ? setTitle(subj, pp.set_no) : "Set";
    const row = sales.get(item) ?? { item, count: 0, revenue: 0 };
    row.count += 1;
    row.revenue += o.amount_paise as number;
    sales.set(item, row);
  }
  const salesRows = [...sales.values()].sort((a, b) => b.count - a.count || b.revenue - a.revenue);

  if (!report.configured) return <Notice text="Razorpay keys are not set, so payments can't be shown." inline />;
  if ("error" in report && report.error) return <Notice text={`Could not load payments from Razorpay: ${report.error}`} inline />;
  const payments = report.payments ?? [];
  const refunds = report.refunds ?? [];

  const ok = payments.filter((x) => x.status === "captured" && !x.refundStatus);
  const failed = payments.filter((x) => x.status === "failed");
  const refunded = payments.filter((x) => x.refundStatus);
  const pending = payments.filter((x) => x.status === "created" || x.status === "authorized");
  const sum = (rows: { amount: number }[]) => rows.reduce((n, r) => n + r.amount, 0);
  const filter = STATUS_FILTERS.find((f) => f.key === status)?.key ?? "all";
  const shown = { all: payments, success: ok, failed, refunded, pending }[filter];

  const cards = [
    ["Successful payments", String(ok.length), formatINR(sum(ok)), "text-teal"],
    ["Failed payments", String(failed.length), formatINR(sum(failed)) + " attempted", "text-red-700"],
    ["Refunded", String(refunded.length), formatINR(refunded.reduce((n, r) => n + r.amountRefunded, 0)) + " returned", "text-ink"],
    ["Not completed", String(pending.length), "started but not paid", "text-muted"],
  ];

  return (
    <>
      <p className="mb-5 text-sm text-ink-soft">
        Straight from Razorpay ({isLiveMode ? "live mode — real money" : "test mode"}), latest {payments.length} payments. Click a payment ID to open it in
        Razorpay, where you can also issue refunds.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, count, note, color]) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
            <p className={`font-display mt-2 text-3xl font-semibold ${color}`}>{count}</p>
            <p className="mt-1 text-xs text-muted">{note}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
          <h2 className="font-display mr-auto text-xl font-semibold">Payments</h2>
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin?tab=payments&status=${f.key}`}
              className={`chip ${f.key === filter ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-ink"}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Item</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted">No payments here.</td>
                </tr>
              )}
              {shown.map((x) => {
                const [label, cls] = paymentBadge(x.status, x.refundStatus);
                return (
                  <tr key={x.id} className="border-t border-line align-top">
                    <td className="whitespace-nowrap p-3 text-muted">
                      {new Date(x.createdAt * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{x.userEmail || x.rzpEmail || "—"}</p>
                      {x.userName && <p className="text-xs text-muted">{x.userName}</p>}
                      {x.rzpContact && <p className="text-xs text-muted">{x.rzpContact}</p>}
                    </td>
                    <td className="p-3">{x.item ?? "—"}</td>
                    <td className="whitespace-nowrap p-3">
                      {formatINR(x.amount)}
                      {x.amountRefunded > 0 && <p className="text-xs text-muted">{formatINR(x.amountRefunded)} refunded</p>}
                    </td>
                    <td className="p-3 uppercase text-muted">{x.method}</td>
                    <td className="p-3">
                      <span className={`chip ${cls}`}>{label}</span>
                      {x.error && <p className="mt-1 max-w-[220px] text-xs text-red-700">{x.error}</p>}
                    </td>
                    <td className="p-3">
                      <a
                        href={`https://dashboard.razorpay.com/app/payments/${x.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-ink-soft underline"
                      >
                        {x.id}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <h2 className="font-display border-b border-line p-4 text-xl font-semibold">Refunds</h2>
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Customer / item</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {refunds.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted">No refunds.</td>
                </tr>
              )}
              {refunds.map((r) => (
                <tr key={r.id} className="border-t border-line align-top">
                  <td className="whitespace-nowrap p-3 text-muted">{new Date(r.createdAt * 1000).toLocaleDateString("en-IN")}</td>
                  <td className="p-3">
                    <p className="font-medium">{r.userEmail ?? "—"}</p>
                    <p className="text-xs text-muted">{r.item ?? r.paymentId}</p>
                  </td>
                  <td className="p-3">{formatINR(r.amount)}</td>
                  <td className="p-3">
                    <span
                      className={`chip ${
                        r.status === "processed" ? "bg-teal-soft text-teal" : r.status === "failed" ? "bg-red-50 text-red-700" : "bg-gold-soft text-gold"
                      }`}
                    >
                      {r.status === "processed" ? "Successful" : r.status === "failed" ? "Failed" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line p-3 text-xs text-muted">
            A refund does not remove the customer&apos;s access automatically — remove it in Customer access if needed.
          </p>
        </div>

        <div className="card overflow-hidden">
          <h2 className="font-display border-b border-line p-4 text-xl font-semibold">What sold (paid orders)</h2>
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Sold</th>
                <th className="p-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {salesRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted">No sales yet.</td>
                </tr>
              )}
              {salesRows.map((s) => (
                <tr key={s.item} className="border-t border-line">
                  <td className="p-3">{s.item}</td>
                  <td className="p-3 font-semibold">{s.count}</td>
                  <td className="p-3">{formatINR(s.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ customers */

async function Customers({ admin }: { admin: Admin }) {
  const [users, { data: profiles }, { data: purchases }, { data: paid }] = await Promise.all([
    listAllUsers(admin).catch(() => []),
    admin.from("profiles").select("id,full_name,phone,is_admin").limit(20000),
    admin.from("purchases").select("user_id,subject_id,paper_id").limit(50000),
    admin.from("orders").select("user_id,amount_paise").eq("status", "paid").limit(50000),
  ]);
  const prof = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  const owned = new Map<string, { bundles: number; sets: number }>();
  for (const p of purchases ?? []) {
    const r = owned.get(p.user_id as string) ?? { bundles: 0, sets: 0 };
    if (p.subject_id) r.bundles += 1;
    else r.sets += 1;
    owned.set(p.user_id as string, r);
  }
  const spent = new Map<string, number>();
  for (const o of paid ?? []) spent.set(o.user_id as string, (spent.get(o.user_id as string) ?? 0) + (o.amount_paise as number));
  const rows = [...users].sort((a, b) => (spent.get(b.id) ?? 0) - (spent.get(a.id) ?? 0) || b.created_at.localeCompare(a.created_at));
  const buyers = rows.filter((u) => (spent.get(u.id) ?? 0) > 0).length;

  return (
    <>
      <p className="mb-5 text-sm text-ink-soft">
        {rows.length} accounts · {buyers} have paid. Click an email to see or change what they own.
      </p>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Last sign-in</th>
                <th className="p-3">Email confirmed</th>
                <th className="p-3">Owns</th>
                <th className="p-3">Total paid</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const p = prof.get(u.id);
                const o = owned.get(u.id);
                return (
                  <tr key={u.id} className="border-t border-line align-top">
                    <td className="p-3">
                      <Link href={`/admin?tab=access&email=${encodeURIComponent(u.email ?? "")}`} className="font-medium underline decoration-line underline-offset-4 hover:decoration-gold">
                        {u.email}
                      </Link>
                      {(p?.full_name as string | null) && <p className="text-xs text-muted">{p?.full_name as string}</p>}
                      {(p?.phone as string | null) && <p className="text-xs text-muted">{p?.phone as string}</p>}
                      {Boolean(p?.is_admin) && <span className="chip mt-1 bg-gold-soft text-gold">Admin</span>}
                    </td>
                    <td className="whitespace-nowrap p-3 text-muted">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="whitespace-nowrap p-3 text-muted">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="p-3">{u.email_confirmed_at ? "Yes" : <span className="text-muted">Not yet</span>}</td>
                    <td className="p-3 text-muted">
                      {o ? [o.bundles ? `${o.bundles} bundle${o.bundles > 1 ? "s" : ""}` : "", o.sets ? `${o.sets} set${o.sets > 1 ? "s" : ""}` : ""].filter(Boolean).join(", ") : "—"}
                    </td>
                    <td className="p-3 font-semibold">{spent.get(u.id) ? formatINR(spent.get(u.id)!) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ prices */

async function Prices({ admin }: { admin: Admin }) {
  const [{ data: subjects }, { data: papers }] = await Promise.all([
    admin.from("subjects").select("id,bundle_price_paise,is_bundle_on_sale"),
    admin.from("papers").select("subject_id,price_paise,is_published,paper_files(kind)").limit(5000),
  ]);
  const rows: PriceRow[] = SUBJECTS.map((s) => {
    const sub = (subjects ?? []).find((x) => x.id === s.id);
    const ps = (papers ?? []).filter((p) => p.subject_id === s.id);
    const prices = ps.map((p) => p.price_paise as number);
    const withFiles = ps.filter((p) => ((p.paper_files as unknown[] | null) ?? []).length > 0);
    return {
      id: s.id,
      name: s.name,
      classLevel: s.classLevel,
      stream: s.stream,
      minSet: prices.length ? Math.min(...prices) : 0,
      maxSet: prices.length ? Math.max(...prices) : 0,
      bundle: (sub?.bundle_price_paise as number) ?? 0,
      bundleOnSale: (sub?.is_bundle_on_sale as boolean) ?? true,
      onSale: withFiles.filter((p) => p.is_published).length,
      withFiles: withFiles.length,
    };
  });
  return (
    <>
      <p className="mb-5 max-w-3xl text-sm text-ink-soft">
        Tick one, several or all subjects, then change their prices together. Changes show on the website immediately. For a single set&apos;s
        price, use <Link href="/admin?tab=papers" className="font-semibold underline">Papers &amp; files</Link>.
      </p>
      <BulkPricing rows={rows} />
    </>
  );
}

/* ------------------------------------------------------------------ papers (per subject) */

async function Papers({ admin, subjectId }: { admin: Admin; subjectId?: string }) {
  const subject = SUBJECTS.find((s) => s.id === subjectId) ?? SUBJECTS[0];
  const [{ data: subj }, { data: papers }] = await Promise.all([
    admin.from("subjects").select("bundle_price_paise,is_bundle_on_sale").eq("id", subject.id).maybeSingle(),
    admin.from("papers").select("id,set_no,price_paise,is_published,paper_files(kind,file_name,size_bytes)").eq("subject_id", subject.id).order("set_no"),
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="card h-fit p-3">
        {CLASSES.map((c) => (
          <div key={c.level} className="mb-3">
            <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">{c.title}</p>
            {subjectsFor(c.level).map((s) => (
              <Link
                key={s.id}
                href={`/admin?tab=papers&subject=${s.id}`}
                className={`block rounded-lg px-3 py-1.5 text-sm ${s.id === subject.id ? "bg-ink text-white" : "hover:bg-paper"}`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        ))}
      </aside>
      <section>
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Class {subject.classLevel} · Code {subject.code}</p>
              <h2 className="font-display text-2xl font-semibold">{subject.name}</h2>
            </div>
            <AdminSubjectPrice subjectId={subject.id} pricePaise={subj?.bundle_price_paise ?? 99900} onSale={subj?.is_bundle_on_sale ?? true} />
          </div>
          <p className="mt-3 text-xs text-muted">
            Change one set&apos;s price or switch it on/off sale here. Files uploaded straight into Supabase buckets are linked with the
            sync script (see README). To change many prices at once, use Prices (bulk).
          </p>
        </div>
        {!papers?.length ? (
          <Notice text="No sets found for this subject. Run supabase/seed.sql in the Supabase SQL editor." inline />
        ) : (
          <div className="mt-5 space-y-3">
            {papers.map((p) => (
              <AdminSetRow
                key={p.id}
                paperId={p.id}
                title={setTitle(subject, p.set_no)}
                pricePaise={p.price_paise}
                published={p.is_published}
                files={(p.paper_files as { kind: string; file_name: string; size_bytes: number | null }[]) ?? []}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ admins */

async function Admins({ admin, me, canManage }: { admin: Admin; me: string; canManage: boolean }) {
  const owners = ownerEmails();
  const [{ data: profiles }, users] = await Promise.all([admin.from("profiles").select("id").eq("is_admin", true), listAllUsers(admin).catch(() => [])]);
  const emailOf = new Map(users.map((u) => [u.id, u.email ?? ""]));
  const admins = (profiles ?? [])
    .map((p) => ({ id: p.id as string, email: emailOf.get(p.id as string) ?? "(unknown)" }))
    .filter((a) => !owners.includes(a.email.toLowerCase()));
  return <AdminManager owners={owners} admins={admins} canManage={canManage} me={me.toLowerCase()} />;
}

function Notice({ text, inline }: { text: string; inline?: boolean }) {
  return (
    <div className={inline ? "card mt-5 p-6 text-sm text-muted" : "mx-auto max-w-xl px-4 py-24 text-center"}>
      {inline ? text : <div className="card p-8 text-ink-soft">{text}</div>}
    </div>
  );
}
