import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Owners are the emails in the ADMIN_EMAILS setting (Vercel). Only owners can add or remove other admins. */
export function ownerEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwner(user: Pick<User, "email"> | null) {
  return Boolean(user?.email && ownerEmails().includes(user.email.toLowerCase()));
}

/** Every sign-up (paged through the Supabase admin API). Fine for thousands of customers. */
export async function listAllUsers(admin: AdminClient) {
  const users: User[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

export async function findUserByEmail(admin: AdminClient, email: string) {
  const wanted = email.trim().toLowerCase();
  if (!wanted) return null;
  return (await listAllUsers(admin)).find((u) => u.email?.toLowerCase() === wanted) ?? null;
}

/** Whole rupees in paise, never below ₹1 (the database minimum). */
export function toPaise(rupees: unknown) {
  const n = Number(rupees);
  if (!Number.isFinite(n)) return null;
  return Math.max(100, Math.round(n) * 100);
}
