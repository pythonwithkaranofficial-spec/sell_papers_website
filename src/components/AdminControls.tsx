"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FILE_KINDS } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/client";
import { FileBadge } from "./FileBadge";

async function call(body: Record<string, unknown>) {
  const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || "Request failed");
  return out;
}

const rupees = (paise: number) => String(paise / 100);

export function AdminSetRow(props: {
  paperId: string;
  title: string;
  pricePaise: number;
  published: boolean;
  files: { kind: string; file_name: string; size_bytes: number | null }[];
}) {
  const router = useRouter();
  const [price, setPrice] = useState(rupees(props.pricePaise));
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setErr(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function upload(kind: string, file: File) {
    const accept = kind === "docx" ? /\.docx$/i : /\.pdf$/i;
    if (!accept.test(file.name)) throw new Error(kind === "docx" ? "Choose a .docx file" : "Choose a .pdf file");
    const { path, token } = await call({ action: "upload-url", paperId: props.paperId, kind });
    const { error } = await createClient().storage.from("papers").uploadToSignedUrl(path, token, file, {
      contentType: file.type || (kind === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf"),
    });
    if (error) throw error;
    await call({ action: "file-uploaded", paperId: props.paperId, kind, path, fileName: file.name, size: file.size });
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-4">
        <p className="font-display w-36 text-lg font-semibold">{props.title}</p>
        <label className="flex items-center gap-2 text-sm">
          ₹
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="w-20 rounded-lg border border-line px-2 py-1" />
          <button
            className="text-xs font-semibold text-gold disabled:opacity-50"
            disabled={busy !== null || price === rupees(props.pricePaise)}
            onClick={() => run("price", () => call({ action: "update-paper", paperId: props.paperId, pricePaise: Math.round(Number(price) * 100) }))}
          >
            Save
          </button>
        </label>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={props.published}
            disabled={busy !== null}
            onChange={(e) => run("pub", () => call({ action: "update-paper", paperId: props.paperId, isPublished: e.target.checked }))}
          />
          On sale
        </label>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {FILE_KINDS.map((k) => {
          const f = props.files.find((x) => x.kind === k.kind);
          return (
            <div key={k.kind} className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3">
              <FileBadge kind={k.kind} small />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{k.label}{"optional" in k ? " (optional)" : ""}</p>
                <p className="truncate text-xs text-muted">{f ? `${f.file_name}${f.size_bytes ? ` · ${(f.size_bytes / 1024).toFixed(0)} KB` : ""}` : "No file yet"}</p>
              </div>
              <label className="cursor-pointer text-xs font-semibold text-teal">
                {busy === k.kind ? "…" : f ? "Replace" : "Upload"}
                <input
                  type="file"
                  className="hidden"
                  accept={k.kind === "docx" ? ".docx" : ".pdf"}
                  disabled={busy !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) run(k.kind, () => upload(k.kind, file));
                  }}
                />
              </label>
              {f && (
                <button
                  className="text-xs text-red-700"
                  disabled={busy !== null}
                  onClick={() => confirm(`Delete ${k.label} for ${props.title}?`) && run(k.kind, () => call({ action: "delete-file", paperId: props.paperId, kind: k.kind }))}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
      {err && <p className="mt-2 text-xs text-red-700">{err}</p>}
    </div>
  );
}

export function AdminSubjectPrice({ subjectId, pricePaise, onSale }: { subjectId: string; pricePaise: number; onSale: boolean }) {
  const router = useRouter();
  const [price, setPrice] = useState(rupees(pricePaise));
  const [busy, setBusy] = useState(false);
  async function save(patch: Record<string, unknown>) {
    setBusy(true);
    try {
      await call({ action: "update-subject", subjectId, ...patch });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-semibold">Bundle ₹</span>
      <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-24 rounded-lg border border-line px-2 py-1" />
      <button className="btn btn-outline !py-1.5 text-xs" disabled={busy} onClick={() => save({ bundlePricePaise: Math.round(Number(price) * 100) })}>
        Save
      </button>
      <label className="flex items-center gap-1.5">
        <input type="checkbox" checked={onSale} disabled={busy} onChange={(e) => save({ bundleOnSale: e.target.checked })} /> On sale
      </label>
    </div>
  );
}
