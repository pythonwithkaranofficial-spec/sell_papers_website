import { NextResponse } from "next/server";
import { downloadName, subjectById, type FileKind } from "@/lib/catalog";
import { userOwnsPaper } from "@/lib/data";
import { resolveStoragePath } from "@/lib/storage";
import { createAdminClient, getUser, isAdmin } from "@/lib/supabase/server";

// GET /api/download?paper=<paperId>&kind=docx|pdf|answer_key
// Checks the purchase, then redirects to a 2-minute signed link from the private storage bucket.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const paperId = url.searchParams.get("paper") || "";
  const kind = (url.searchParams.get("kind") || "pdf") as FileKind;
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/account")}`, url));

  if (!(await userOwnsPaper(user.id, paperId)) && !(await isAdmin(user)))
    return NextResponse.json({ error: "You have not purchased this set." }, { status: 403 });

  const admin = createAdminClient();
  const { data: file } = await admin
    .from("paper_files")
    .select("storage_path,papers(set_no,subject_id)")
    .eq("paper_id", paperId)
    .eq("kind", kind)
    .maybeSingle();
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const paper = file.papers as unknown as { set_no: number; subject_id: string } | null;
  const subject = paper ? subjectById(paper.subject_id) : undefined;
  const name = subject && paper ? downloadName(subject, paper.set_no, kind) : undefined;
  const { bucket, path } = resolveStoragePath(file.storage_path);
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 120, { download: name ?? true });
  if (error || !data) return NextResponse.json({ error: "Could not create download link." }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
