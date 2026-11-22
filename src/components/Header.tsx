import Link from "next/link";
import { site } from "@/lib/site";
import { getUser, isAdmin } from "@/lib/supabase/server";
import { Logo } from "./Logo";

export async function Header() {
  const user = await getUser();
  const admin = await isAdmin(user);
  const nav = [
    { href: "/classes/10", label: "Class 10" },
    { href: "/classes/12", label: "Class 12" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#faq", label: "FAQ" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
          <Logo />
          <span className="font-display hidden whitespace-nowrap text-lg font-semibold min-[420px]:inline">{site.name}</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {admin && (
            <Link href="/admin" className="hidden text-sm font-semibold text-gold sm:inline">
              Admin
            </Link>
          )}
          {user ? (
            <Link href="/account" className="btn btn-outline !py-2 text-sm">
              My papers
            </Link>
          ) : (
            <Link href="/login" className="btn btn-primary !py-2 text-sm">
              Sign in
            </Link>
          )}
          <details className="relative md:hidden">
            <summary className="list-none rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold">Menu</summary>
            <div className="card absolute right-0 mt-2 w-48 p-2">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-paper">
                  {n.label}
                </Link>
              ))}
              {admin && (
                <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm font-semibold text-gold hover:bg-paper">
                  Admin
                </Link>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
