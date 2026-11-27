import "server-only";
import { SET_NUMBERS, SUBJECTS, setTitle, subjectById, subjectsFor, type ClassLevel, type FileKind, type Subject } from "./catalog";
import { defaultPrices } from "./site";
import { isSupabaseConfigured } from "./supabase/env";
import { createAdminClient, createClient } from "./supabase/server";

export type SetInfo = {
  setNo: number;
  title: string;
  paperId: string | null;
  pricePaise: number;
  published: boolean;
  files: FileKind[];
  owned: boolean;
};

export type SubjectDetail = {
  subject: Subject;
  bundlePricePaise: number;
  bundleOnSale: boolean;
  ownsBundle: boolean;
  sets: SetInfo[];
  live: boolean; // false = placeholder mode (Supabase not connected yet)
};

function placeholderSets(subject: Subject): SetInfo[] {
  return SET_NUMBERS.map((n) => ({
    setNo: n,
    title: setTitle(subject, n),
    paperId: null,
    pricePaise: defaultPrices.setPaise,
    published: false,
    files: [],
    owned: false,
  }));
}

export async function getSubjectDetail(subject: Subject, userId: string | null): Promise<SubjectDetail> {
  const base: SubjectDetail = {
    subject,
    bundlePricePaise: defaultPrices.subjectBundlePaise,
    bundleOnSale: true,
    ownsBundle: false,
    sets: placeholderSets(subject),
    live: false,
  };
  if (!isSupabaseConfigured) return base;
  try {
    const supabase = await createClient();
    const [{ data: subj }, { data: papers }] = await Promise.all([
      supabase.from("subjects").select("bundle_price_paise,is_bundle_on_sale").eq("id", subject.id).maybeSingle(),
      supabase
        .from("papers")
        .select("id,set_no,title,price_paise,is_published,paper_files(kind)")
        .eq("subject_id", subject.id)
        .order("set_no"),
    ]);
    const ownedPapers = new Set<string>();
    let ownsBundle = false;
    if (userId) {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("paper_id,subject_id")
        .eq("user_id", userId);
      for (const p of purchases ?? []) {
        if (p.subject_id === subject.id) ownsBundle = true;
        if (p.paper_id) ownedPapers.add(p.paper_id);
      }
    }
    const byNo = new Map((papers ?? []).map((p) => [p.set_no as number, p]));
    const sets = SET_NUMBERS.map((n) => {
      const p = byNo.get(n);
      if (!p) return base.sets[n - 1];
      const files = ((p.paper_files as { kind: FileKind }[] | null) ?? []).map((f) => f.kind);
      return {
        setNo: n,
        title: setTitle(subject, n),
        paperId: p.id as string,
        pricePaise: p.price_paise as number,
        published: Boolean(p.is_published) && files.length > 0,
        files,
        owned: ownsBundle || ownedPapers.has(p.id as string),
      };
    });
    return {
      subject,
      bundlePricePaise: subj?.bundle_price_paise ?? base.bundlePricePaise,
      bundleOnSale: subj?.is_bundle_on_sale ?? true,
      ownsBundle,
      sets,
      live: true,
    };
  } catch {
    return base;
  }
}

/** Number of published sets per subject for a class (0 everywhere in placeholder mode). */
export async function getPublishedCounts(level: ClassLevel): Promise<Record<string, number>> {
  const counts: Record<string, number> = Object.fromEntries(subjectsFor(level).map((s) => [s.id, 0]));
  if (!isSupabaseConfigured) return counts;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("papers")
      .select("subject_id,is_published,subjects!inner(class_level)")
      .eq("subjects.class_level", level)
      .eq("is_published", true);
    for (const row of data ?? []) counts[row.subject_id as string] = (counts[row.subject_id as string] ?? 0) + 1;
  } catch {
    /* placeholder counts */
  }
  return counts;
}

export type SubjectSummary = {
  available: number; // sets on sale right now
  setPricePaise: number; // lowest single-set price
  bundlePricePaise: number;
  bundleOnSale: boolean;
};

/** Live availability and prices of every subject, for listing pages (defaults in placeholder mode). */
export async function getCatalogSummary(): Promise<Record<string, SubjectSummary>> {
  const summary: Record<string, SubjectSummary> = Object.fromEntries(
    SUBJECTS.map((s) => [
      s.id,
      { available: 0, setPricePaise: defaultPrices.setPaise, bundlePricePaise: defaultPrices.subjectBundlePaise, bundleOnSale: true },
    ]),
  );
  if (!isSupabaseConfigured) return summary;
  try {
    const supabase = await createClient();
    const [{ data: subjects }, { data: papers }] = await Promise.all([
      supabase.from("subjects").select("id,bundle_price_paise,is_bundle_on_sale"),
      supabase.from("papers").select("subject_id,price_paise,is_published,paper_files(kind)").limit(5000),
    ]);
    for (const s of subjects ?? []) {
      const row = summary[s.id as string];
      if (!row) continue;
      row.bundlePricePaise = (s.bundle_price_paise as number) ?? row.bundlePricePaise;
      row.bundleOnSale = (s.is_bundle_on_sale as boolean) ?? true;
    }
    const minPrice: Record<string, number> = {};
    for (const p of papers ?? []) {
      const id = p.subject_id as string;
      const row = summary[id];
      if (!row) continue;
      const hasFiles = ((p.paper_files as unknown[] | null) ?? []).length > 0;
      if (p.is_published && hasFiles) {
        row.available += 1;
        minPrice[id] = Math.min(minPrice[id] ?? Infinity, p.price_paise as number);
      }
    }
    for (const [id, price] of Object.entries(minPrice)) summary[id].setPricePaise = price;
  } catch {
    /* fall back to defaults */
  }
  return summary;
}

export type LibraryItem = { subject: Subject; set: SetInfo };

/** Every set the user owns (individually or through a subject bundle). */
export async function getLibrary(userId: string): Promise<{ items: LibraryItem[]; bundles: Subject[] }> {
  if (!isSupabaseConfigured) return { items: [], bundles: [] };
  const supabase = await createClient();
  const { data: purchases } = await supabase.from("purchases").select("paper_id,subject_id").eq("user_id", userId);
  const subjectIds = new Set<string>();
  const paperIds = new Set<string>();
  for (const p of purchases ?? []) {
    if (p.subject_id) subjectIds.add(p.subject_id);
    if (p.paper_id) paperIds.add(p.paper_id);
  }
  const bundles = [...subjectIds].map(subjectById).filter(Boolean) as Subject[];
  const filters: string[] = [];
  if (paperIds.size) filters.push(`id.in.(${[...paperIds].join(",")})`);
  if (subjectIds.size) filters.push(`subject_id.in.(${[...subjectIds].join(",")})`);
  if (!filters.length) return { items: [], bundles };
  const { data: papers } = await supabase
    .from("papers")
    .select("id,subject_id,set_no,title,price_paise,is_published,paper_files(kind)")
    .or(filters.join(","))
    .order("subject_id")
    .order("set_no");
  const items: LibraryItem[] = [];
  for (const p of papers ?? []) {
    const subject = subjectById(p.subject_id as string);
    if (!subject) continue;
    const files = ((p.paper_files as { kind: FileKind }[] | null) ?? []).map((f) => f.kind);
    items.push({
      subject,
      set: {
        setNo: p.set_no as number,
        title: setTitle(subject, p.set_no as number),
        paperId: p.id as string,
        pricePaise: p.price_paise as number,
        published: Boolean(p.is_published) && files.length > 0,
        files,
        owned: true,
      },
    });
  }
  return { items, bundles };
}

/** Server-side entitlement check used before issuing a download link. */
export async function userOwnsPaper(userId: string, paperId: string) {
  const admin = createAdminClient();
  const { data: paper } = await admin.from("papers").select("subject_id").eq("id", paperId).maybeSingle();
  if (!paper) return false;
  const { data } = await admin
    .from("purchases")
    .select("id")
    .eq("user_id", userId)
    .or(`paper_id.eq.${paperId},subject_id.eq.${paper.subject_id}`)
    .limit(1);
  return Boolean(data && data.length);
}
