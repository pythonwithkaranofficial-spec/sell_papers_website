import "server-only";
import { unstable_cache } from "next/cache";
import { SET_NUMBERS, SUBJECTS, setTitle, subjectById, type FileKind, type Subject } from "./catalog";
import { defaultPrices } from "./site";
import { isSupabaseConfigured } from "./supabase/env";
import { createPublicClient } from "./supabase/public";
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

/** Tag on all cached catalogue data; revalidate it after uploads or price changes. */
export const CATALOG_TAG = "catalog";

type CatalogPaper = { id: string; subject_id: string; set_no: number; price_paise: number; is_published: boolean; kinds: FileKind[] };
type CatalogSubject = { id: string; bundle_price_paise: number; is_bundle_on_sale: boolean };

/**
 * Public catalogue (subjects, sets, which files exist), cached for 60 seconds and shared by every visitor,
 * so listing and product pages don't wait on the database. Throws on errors so failures are never cached.
 */
const getCatalog = unstable_cache(
  async (): Promise<{ subjects: CatalogSubject[]; papers: CatalogPaper[] }> => {
    const supabase = createPublicClient();
    const [s, p] = await Promise.all([
      supabase.from("subjects").select("id,bundle_price_paise,is_bundle_on_sale"),
      supabase.from("papers").select("id,subject_id,set_no,price_paise,is_published,paper_files(kind)").limit(5000),
    ]);
    if (s.error) throw new Error(s.error.message);
    if (p.error) throw new Error(p.error.message);
    return {
      subjects: (s.data ?? []) as CatalogSubject[],
      papers: (p.data ?? []).map((r) => ({
        id: r.id as string,
        subject_id: r.subject_id as string,
        set_no: r.set_no as number,
        price_paise: r.price_paise as number,
        is_published: Boolean(r.is_published),
        kinds: ((r.paper_files as { kind: FileKind }[] | null) ?? []).map((f) => f.kind),
      })),
    };
  },
  ["catalog-v1"],
  { revalidate: 60, tags: [CATALOG_TAG] },
);

async function loadCatalog() {
  if (!isSupabaseConfigured) return null;
  try {
    return await getCatalog();
  } catch {
    return null;
  }
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
  // Catalogue comes from the shared cache; only the visitor's own purchases are read live.
  const [catalog, purchases] = await Promise.all([loadCatalog(), userId ? getPurchases(userId) : Promise.resolve([])]);
  if (!catalog) return base;
  let ownsBundle = false;
  const ownedPapers = new Set<string>();
  for (const p of purchases) {
    if (p.subject_id === subject.id) ownsBundle = true;
    if (p.paper_id) ownedPapers.add(p.paper_id);
  }
  const subj = catalog.subjects.find((s) => s.id === subject.id);
  const byNo = new Map(catalog.papers.filter((p) => p.subject_id === subject.id).map((p) => [p.set_no, p]));
  const sets = SET_NUMBERS.map((n) => {
    const p = byNo.get(n);
    if (!p) return base.sets[n - 1];
    return {
      setNo: n,
      title: setTitle(subject, n),
      paperId: p.id,
      pricePaise: p.price_paise,
      published: p.is_published && p.kinds.length > 0,
      files: p.kinds,
      owned: ownsBundle || ownedPapers.has(p.id),
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
}

async function getPurchases(userId: string): Promise<{ paper_id: string | null; subject_id: string | null }[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("purchases").select("paper_id,subject_id").eq("user_id", userId);
    return data ?? [];
  } catch {
    return [];
  }
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
  const catalog = await loadCatalog();
  if (!catalog) return summary;
  for (const s of catalog.subjects) {
    const row = summary[s.id];
    if (!row) continue;
    row.bundlePricePaise = s.bundle_price_paise ?? row.bundlePricePaise;
    row.bundleOnSale = s.is_bundle_on_sale ?? true;
  }
  const minPrice: Record<string, number> = {};
  for (const p of catalog.papers) {
    const row = summary[p.subject_id];
    if (!row) continue;
    if (p.is_published && p.kinds.length > 0) {
      row.available += 1;
      minPrice[p.subject_id] = Math.min(minPrice[p.subject_id] ?? Infinity, p.price_paise);
    }
  }
  for (const [id, price] of Object.entries(minPrice)) summary[id].setPricePaise = price;
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
