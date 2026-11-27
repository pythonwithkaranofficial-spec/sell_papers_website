#!/usr/bin/env node
// Links paper files that were uploaded straight into Supabase Storage buckets to the website's sets.
//
//   node --env-file=.env.local scripts/sync-papers.mjs            # dry run: shows what would change
//   node --env-file=.env.local scripts/sync-papers.mjs --apply    # writes to the database
//
// Options:  --bucket <name>   only scan this bucket (repeatable; default: every bucket)
//           --force           re-link files even if they are already linked
//
// File names must look like "<Subject_Name>_Set_<n>.pdf" or ".docx", e.g. "Mathematics_Standard_Set_7.pdf".
// The subject is matched by name (underscores = spaces, "and" = "&", brackets ignored), so the folder
// layout inside a bucket does not matter. For each matched file it upserts `paper_files`
// (storage_path = "storage://<bucket>/<path>") and puts the set on sale (`papers.is_published = true`).
// Nothing is uploaded, moved or deleted in Storage.

import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const FORCE = args.includes("--force");
const onlyBuckets = args.flatMap((a, i) => (a === "--bucket" ? [args[i + 1]] : [])).filter(Boolean);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env.local).");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const FILE_RE = /^(.+?)[_ ]+Set[_ -]*(\d+)\.(pdf|docx)$/i;
const KIND = { pdf: "pdf", docx: "docx" };
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");

async function walk(bucket, prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
    for (const it of data) {
      const path = prefix ? `${prefix}/${it.name}` : it.name;
      if (it.id === null) out.push(...(await walk(bucket, path)));
      else out.push({ bucket, path, name: it.name, size: it.metadata?.size ?? null });
    }
    if (data.length < 1000) break;
  }
  return out;
}

async function main() {
  console.log(APPLY ? "Mode: APPLY (writing to the database)\n" : "Mode: DRY RUN (nothing is written; add --apply)\n");

  const { data: subjects, error: sErr } = await sb.from("subjects").select("id,name,class_level");
  if (sErr) throw sErr;
  const byName = new Map(subjects.map((s) => [norm(s.name), s]));

  const { data: papers, error: pErr } = await sb.from("papers").select("id,subject_id,set_no,is_published").limit(5000);
  if (pErr) throw pErr;
  const paperOf = new Map(papers.map((p) => [`${p.subject_id}#${p.set_no}`, p]));

  const { data: existing, error: fErr } = await sb.from("paper_files").select("paper_id,kind,storage_path,size_bytes").limit(10000);
  if (fErr) throw fErr;
  const linked = new Map(existing.map((f) => [`${f.paper_id}#${f.kind}`, f]));

  const { data: buckets, error: bErr } = await sb.storage.listBuckets();
  if (bErr) throw bErr;
  const scan = buckets.filter((b) => !onlyBuckets.length || onlyBuckets.includes(b.id));
  for (const b of scan) if (b.public) console.log(`⚠  Bucket "${b.id}" is PUBLIC — anyone with a file's address can download it. Make it private in Supabase.`);

  const files = [];
  for (const b of scan) files.push(...(await walk(b.id)));

  const report = {};
  const bump = (subject, what) => ((report[subject] ??= { linked: 0, already: 0 })[what] += 1);
  const problems = [];
  const seen = new Map();
  const toPublish = new Set();

  for (const f of files) {
    const m = f.name.match(FILE_RE);
    if (!m) {
      problems.push(`not a paper file name: ${f.bucket}/${f.path}`);
      continue;
    }
    const subject = byName.get(norm(m[1]));
    if (!subject) {
      problems.push(`no subject matches "${m[1].replace(/_/g, " ")}": ${f.bucket}/${f.path}`);
      continue;
    }
    const setNo = Number(m[2]);
    const paper = paperOf.get(`${subject.id}#${setNo}`);
    if (!paper) {
      problems.push(`no Set ${setNo} slot for ${subject.name}: ${f.bucket}/${f.path}`);
      continue;
    }
    const kind = KIND[m[3].toLowerCase()];
    const slot = `${paper.id}#${kind}`;
    if (seen.has(slot)) {
      problems.push(`duplicate ${kind} for ${subject.name} Set ${setNo}: ${seen.get(slot)} and ${f.bucket}/${f.path} (kept the first)`);
      continue;
    }
    seen.set(slot, `${f.bucket}/${f.path}`);

    const storagePath = `storage://${f.bucket}/${f.path}`;
    const label = `Class ${subject.class_level} · ${subject.name}`;
    const cur = linked.get(slot);
    if (cur && cur.storage_path === storagePath && cur.size_bytes === f.size && !FORCE) {
      bump(label, "already");
      if (!paper.is_published) toPublish.add(paper.id);
      continue;
    }
    if (APPLY) {
      const { error } = await sb.from("paper_files").upsert(
        { paper_id: paper.id, kind, storage_path: storagePath, file_name: f.name, size_bytes: f.size, uploaded_at: new Date().toISOString() },
        { onConflict: "paper_id,kind" },
      );
      if (error) {
        problems.push(`failed to link ${f.bucket}/${f.path}: ${error.message}`);
        continue;
      }
    }
    bump(label, "linked");
    if (!paper.is_published) toPublish.add(paper.id);
  }

  if (APPLY && toPublish.size) {
    const ids = [...toPublish];
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await sb
        .from("papers")
        .update({ is_published: true, updated_at: new Date().toISOString() })
        .in("id", ids.slice(i, i + 200));
      if (error) problems.push(`failed to publish sets: ${error.message}`);
    }
  }

  console.log(`Scanned ${files.length} files in ${scan.length} bucket(s).\n`);
  for (const [subject, r] of Object.entries(report).sort()) {
    console.log(`  ${subject.padEnd(44)} ${APPLY ? "linked" : "would link"} ${String(r.linked).padStart(3)}   already linked ${r.already}`);
  }
  console.log(`\nSets ${APPLY ? "put" : "that would be put"} on sale: ${toPublish.size}`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    problems.forEach((p) => console.log("  - " + p));
    process.exitCode = 2;
  } else console.log("No problems found.");
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
