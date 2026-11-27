"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

async function call(body: Record<string, unknown>) {
  const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || "Request failed");
  return out as Record<string, unknown>;
}

const inr = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

function Result({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return <p className={`mt-4 rounded-lg p-3 text-sm ${msg.ok ? "bg-teal-soft text-teal" : "bg-red-50 text-red-700"}`}>{msg.text}</p>;
}

/* ------------------------------------------------------------------ bulk pricing */

export type PriceRow = {
  id: string;
  name: string;
  classLevel: string;
  stream: string;
  minSet: number;
  maxSet: number;
  bundle: number;
  bundleOnSale: boolean;
  onSale: number;
  withFiles: number;
};

export function BulkPricing({ rows }: { rows: PriceRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [setPrice, setSetPrice] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [percent, setPercent] = useState("");
  const [percentTarget, setPercentTarget] = useState("both");
  const [bundleOnSale, setBundleOnSale] = useState("");
  const [setsOnSale, setSetsOnSale] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const pick = (ids: string[]) => setSelected(new Set(ids));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function apply() {
    setMsg(null);
    if (!selected.size) return setMsg({ ok: false, text: "Select at least one subject first." });
    const parts: string[] = [];
    if (setPrice) parts.push(`set price → ₹${setPrice} (all 30 sets)`);
    if (bundlePrice) parts.push(`bundle price → ₹${bundlePrice}`);
    if (percent) parts.push(`${Number(percent) > 0 ? "+" : ""}${percent}% on ${percentTarget === "both" ? "sets and bundles" : percentTarget}`);
    if (bundleOnSale) parts.push(bundleOnSale === "on" ? "bundles ON sale" : "bundles OFF sale");
    if (setsOnSale) parts.push(setsOnSale === "on" ? "sets with files ON sale" : "all sets OFF sale");
    if (!parts.length) return setMsg({ ok: false, text: "Enter a price or a percentage, or choose an on/off-sale option." });
    if (!confirm(`Apply to ${selected.size} subject(s)?\n\n• ${parts.join("\n• ")}`)) return;
    setBusy(true);
    try {
      const out = await call({
        action: "bulk-prices",
        subjectIds: [...selected],
        setPrice: setPrice || undefined,
        bundlePrice: bundlePrice || undefined,
        percent: percent || undefined,
        percentTarget,
        bundleOnSale: bundleOnSale ? bundleOnSale === "on" : undefined,
        setsOnSale: setsOnSale ? setsOnSale === "on" : undefined,
      });
      setMsg({ ok: true, text: String(out.message) });
      setSetPrice("");
      setBundlePrice("");
      setPercent("");
      setBundleOnSale("");
      setSetsOnSale("");
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4 text-sm">
          <span className="font-semibold">Select:</span>
          <button className="btn btn-outline !px-3 !py-1 text-xs" onClick={() => pick(allIds)}>All subjects</button>
          <button className="btn btn-outline !px-3 !py-1 text-xs" onClick={() => pick(rows.filter((r) => r.classLevel === "10").map((r) => r.id))}>Class 10</button>
          <button className="btn btn-outline !px-3 !py-1 text-xs" onClick={() => pick(rows.filter((r) => r.classLevel === "12").map((r) => r.id))}>Class 12</button>
          <button className="btn btn-outline !px-3 !py-1 text-xs" onClick={() => pick(rows.filter((r) => r.onSale > 0).map((r) => r.id))}>On sale now</button>
          <button className="btn btn-outline !px-3 !py-1 text-xs" onClick={() => pick([])}>None</button>
          <span className="ml-auto text-muted">{selected.size} selected</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    aria-label="Select all subjects"
                    checked={selected.size === rows.length && rows.length > 0}
                    onChange={(e) => pick(e.target.checked ? allIds : [])}
                  />
                </th>
                <th className="p-3">Subject</th>
                <th className="p-3">Per set</th>
                <th className="p-3">Bundle</th>
                <th className="p-3">Sets on sale</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={`border-t border-line ${selected.has(r.id) ? "bg-gold-soft/40" : ""}`}>
                  <td className="p-3">
                    <input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td className="p-3">
                    <button className="text-left" onClick={() => toggle(r.id)}>
                      <span className="font-semibold">{r.name}</span>
                      <span className="block text-xs text-muted">Class {r.classLevel} · {r.stream}</span>
                    </button>
                  </td>
                  <td className="p-3">{r.minSet === r.maxSet ? inr(r.minSet) : `${inr(r.minSet)} – ${inr(r.maxSet)}`}</td>
                  <td className="p-3">
                    {inr(r.bundle)}
                    {!r.bundleOnSale && <span className="chip ml-2 bg-paper-deep text-muted">off sale</span>}
                  </td>
                  <td className="p-3">
                    <span className={r.onSale ? "font-semibold text-teal" : "text-muted"}>{r.onSale}/30</span>
                    {r.withFiles > r.onSale && <span className="block text-xs text-muted">{r.withFiles} have files</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card h-fit p-5 xl:sticky xl:top-24">
        <h3 className="font-display text-xl font-semibold">Change selected subjects</h3>
        <p className="mt-1 text-xs text-muted">Fill only what you want to change. Prices are in whole rupees and include taxes.</p>
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-medium">Price per set (applies to all 30 sets)</span>
            <input className={`${input} mt-1`} inputMode="numeric" placeholder="e.g. 49" value={setPrice} onChange={(e) => setSetPrice(e.target.value.replace(/[^\d]/g, ""))} />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Bundle price (all 30 sets)</span>
            <input className={`${input} mt-1`} inputMode="numeric" placeholder="e.g. 999" value={bundlePrice} onChange={(e) => setBundlePrice(e.target.value.replace(/[^\d]/g, ""))} />
          </label>
          <div className="text-sm">
            <span className="font-medium">Increase or decrease by %</span>
            <div className="mt-1 flex gap-2">
              <input className={input} inputMode="decimal" placeholder="e.g. 10 or -20" value={percent} onChange={(e) => setPercent(e.target.value.replace(/[^\d.-]/g, ""))} />
              <select className={input} value={percentTarget} onChange={(e) => setPercentTarget(e.target.value)}>
                <option value="both">Sets + bundles</option>
                <option value="sets">Sets only</option>
                <option value="bundles">Bundles only</option>
              </select>
            </div>
            <span className="mt-1 block text-xs text-muted">Rounded to the nearest rupee. Use a minus sign for a discount.</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="block">
              <span className="font-medium">Bundles</span>
              <select className={`${input} mt-1`} value={bundleOnSale} onChange={(e) => setBundleOnSale(e.target.value)}>
                <option value="">No change</option>
                <option value="on">On sale</option>
                <option value="off">Off sale</option>
              </select>
            </label>
            <label className="block">
              <span className="font-medium">Single sets</span>
              <select className={`${input} mt-1`} value={setsOnSale} onChange={(e) => setSetsOnSale(e.target.value)}>
                <option value="">No change</option>
                <option value="on">On sale</option>
                <option value="off">Off sale</option>
              </select>
            </label>
          </div>
          <button className="btn btn-gold w-full" disabled={busy} onClick={apply}>
            {busy ? "Applying…" : `Apply to ${selected.size} subject${selected.size === 1 ? "" : "s"}`}
          </button>
        </div>
        <Result msg={msg} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ customer access */

type Purchase = { id: string; paper_id: string | null; subject_id: string | null; order_id: string | null; created_at: string; papers: { set_no: number; subject_id: string } | null };

export function AccessManager({ subjects, initialEmail = "" }: { subjects: { id: string; label: string }[]; initialEmail?: string }) {
  const nameOf = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s.label])), [subjects]);
  const [email, setEmail] = useState(initialEmail);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [scope, setScope] = useState("bundle");
  const [setNo, setSetNo] = useState("1");
  const [customer, setCustomer] = useState<{ email: string; purchases: Purchase[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }
  const lookup = () =>
    run(async () => {
      const out = await call({ action: "customer", email });
      setCustomer({ email: String((out.user as { email: string }).email), purchases: out.purchases as Purchase[] });
    });
  const grant = () =>
    run(async () => {
      const out = await call({ action: "grant-access", email, subjectId, setNo: scope === "set" ? setNo : undefined });
      setMsg({ ok: true, text: String(out.message) });
      const again = await call({ action: "customer", email });
      setCustomer({ email: String((again.user as { email: string }).email), purchases: again.purchases as Purchase[] });
    });
  const revoke = (p: Purchase) =>
    confirm("Remove this access? The customer will no longer be able to download it.") &&
    run(async () => {
      const out = await call({ action: "revoke-access", purchaseId: p.id });
      setMsg({ ok: true, text: String(out.message) });
      setCustomer((c) => (c ? { ...c, purchases: c.purchases.filter((x) => x.id !== p.id) } : c));
    });

  const input = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink";
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="font-display text-xl font-semibold">Find a customer</h3>
        <p className="mt-1 text-xs text-muted">See what a customer owns — useful when someone says “I paid but can’t see my papers”.</p>
        <div className="mt-4 flex gap-2">
          <input className={input} type="email" placeholder="customer@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn btn-primary !py-2 text-sm" disabled={busy || !email} onClick={lookup}>Look up</button>
        </div>
        {customer && (
          <div className="mt-5">
            <p className="text-sm font-semibold">{customer.email} owns {customer.purchases.length} item(s)</p>
            <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
              {customer.purchases.length === 0 && <li className="p-3 text-sm text-muted">Nothing yet.</li>}
              {customer.purchases.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {p.subject_id ? `${nameOf[p.subject_id] ?? p.subject_id} — whole bundle` : `${nameOf[p.papers?.subject_id ?? ""] ?? ""} — Set ${p.papers?.set_no ?? "?"}`}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(p.created_at).toLocaleDateString("en-IN")} · {p.order_id ? "paid order" : "given by admin"}
                    </p>
                  </div>
                  <button className="text-xs font-semibold text-red-700 hover:underline" disabled={busy} onClick={() => revoke(p)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card h-fit p-5">
        <h3 className="font-display text-xl font-semibold">Give access</h3>
        <p className="mt-1 text-xs text-muted">Unlock a set or a whole subject for a customer without payment (e.g. a gift or a payment problem). They must have an account.</p>
        <div className="mt-4 space-y-3 text-sm">
          <input className={input} type="email" placeholder="customer@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className={input} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select className={input} value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="bundle">Whole subject (all 30 sets)</option>
              <option value="set">One set</option>
            </select>
            {scope === "set" && (
              <select className={input} value={setNo} onChange={(e) => setSetNo(e.target.value)}>
                {Array.from({ length: 30 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Set {i + 1}</option>
                ))}
              </select>
            )}
          </div>
          <button className="btn btn-gold w-full" disabled={busy || !email} onClick={grant}>Give access</button>
        </div>
      </div>
      <div className="lg:col-span-2">
        <Result msg={msg} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ admins */

export function AdminManager({
  owners,
  admins,
  canManage,
  me,
}: {
  owners: string[];
  admins: { id: string; email: string }[];
  canManage: boolean;
  me: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const out = await call(body);
      setMsg({ ok: true, text: String(out.message) });
      setEmail("");
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="font-display text-xl font-semibold">Who can use this panel</h3>
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line text-sm">
          {owners.map((o) => (
            <li key={o} className="flex items-center justify-between gap-3 p-3">
              <span className="font-medium">{o}{o === me ? " (you)" : ""}</span>
              <span className="chip bg-ink text-white">Owner</span>
            </li>
          ))}
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 p-3">
              <span className="font-medium">{a.email}{a.email === me ? " (you)" : ""}</span>
              <span className="flex items-center gap-3">
                <span className="chip bg-gold-soft text-gold">Admin</span>
                {canManage && (
                  <button
                    className="text-xs font-semibold text-red-700 hover:underline"
                    disabled={busy}
                    onClick={() => confirm(`Remove admin rights from ${a.email}?`) && run({ action: "remove-admin", userId: a.id })}
                  >
                    Remove
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          <strong>Owners</strong> are the emails in the <code>ADMIN_EMAILS</code> setting on Vercel — change that list in Vercel (then redeploy). Owners can add
          and remove admins. <strong>Admins</strong> can manage papers, prices and customer access, but cannot add other admins.
        </p>
      </div>
      <div className="card h-fit p-5">
        <h3 className="font-display text-xl font-semibold">Add an admin</h3>
        {canManage ? (
          <>
            <p className="mt-1 text-xs text-muted">The person must first create an account on the website with this email.</p>
            <div className="mt-4 flex gap-2">
              <input
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink"
                type="email"
                placeholder="new.admin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn btn-gold !py-2 text-sm" disabled={busy || !email} onClick={() => run({ action: "add-admin", email })}>Add</button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">Only an owner can add or remove admins.</p>
        )}
        <Result msg={msg} />
      </div>
    </div>
  );
}
