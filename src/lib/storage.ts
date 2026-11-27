// Where a paper file lives in Supabase Storage.
//
// `paper_files.storage_path` holds either:
//   • "storage://<bucket>/<path inside bucket>" for files uploaded straight into a bucket in the
//     Supabase dashboard (e.g. "storage://papers-sci/papers-sci/Science/Set-1/Science_Set_1.pdf"),
//     registered with `node --env-file=.env.local scripts/sync-papers.mjs`, or
//   • a plain path inside the default bucket, for files uploaded through /admin.

/** Bucket used by the /admin upload panel. */
export const DEFAULT_BUCKET = "papers";

const PREFIX = "storage://";

export function resolveStoragePath(storagePath: string): { bucket: string; path: string } {
  if (storagePath.startsWith(PREFIX)) {
    const rest = storagePath.slice(PREFIX.length);
    const slash = rest.indexOf("/");
    if (slash > 0) return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) };
  }
  return { bucket: DEFAULT_BUCKET, path: storagePath };
}

export function toStoragePath(bucket: string, path: string) {
  return bucket === DEFAULT_BUCKET ? path : `${PREFIX}${bucket}/${path}`;
}
