import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase email links (sign-up confirmation, magic link, password reset) and Google sign-in land here.
//  • ?code=…                      — default link format; works in the browser that asked for the email
//  • ?token_hash=…&type=recovery  — format used by the custom email templates; works on any device
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") || (type === "recovery" ? "/reset-password" : "/account");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  const supabase = await createClient();
  if (tokenHash && type) {
    await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  } else if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
