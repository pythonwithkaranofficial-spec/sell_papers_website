import Link from "next/link";
import { site } from "@/lib/site";
import { getUser, isAdmin } from "@/lib/supabase/server";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

const nav = [
  { href: "/classes/10", label: "Class 10" },
  { href: "/classes/12", label: "Class 12" },
  { href: "/papers", label: "All papers" },
  { href: "/#inside", label: "What you get", wide: true },
  { href: "/#faq", label: "FAQ" },
];

export async function Header() {
  const user = await getUser();
  const admin = await isAdmin(user);
  return (
    <>
      {/* announcement bar */}
      <div className="bg-ink-deep text-white/85">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs sm:text-[13px]">
          <Icon name="sparkles" className="hidden h-4 w-4 text-gold-bright sm:block" />
          <span>
            <strong className="font-semibold text-white">CBSE {site.session} practice papers</strong>
            <span className="hidden sm:inline"> for Board Exams 2027</span> · Instant download after secure payment
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${site.name} home`}>
            <Logo />
            <span className="hidden min-w-0 flex-col leading-tight min-[420px]:flex">
              <span className="font-display truncate text-[1.05rem] font-semibold">{site.name}</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Class 10 &amp; 12 · Session {site.session}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-ink-soft lg:flex" aria-label="Main">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className={`whitespace-nowrap transition hover:text-ink ${"wide" in n ? "hidden xl:inline" : ""}`}>
                {n.label}
              </Link>
            ))}
            <span className="hidden items-center gap-1.5 whitespace-nowrap text-muted xl:flex">
              Question banks
              <span className="chip bg-gold-soft !px-1.5 !py-0 text-[10px] text-gold">Soon</span>
            </span>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {admin && (
              <Link href="/admin" className="hidden text-sm font-semibold text-gold sm:inline">
                Admin
              </Link>
            )}
            {user ? (
              <Link href="/account" className="btn btn-outline !py-2 text-sm">
                <Icon name="download" className="h-4 w-4" /> My papers
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden text-sm font-semibold text-ink-soft hover:text-ink sm:inline">
                  Sign in
                </Link>
                <Link href="/papers" className="btn btn-primary !py-2 text-sm">
                  Shop papers
                </Link>
              </>
            )}
            <details className="relative lg:hidden">
              <summary
                className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-line bg-white"
                aria-label="Open menu"
              >
                <Icon name="menu" className="h-5 w-5" />
              </summary>
              <div className="card absolute right-0 mt-2 w-60 p-2">
                {nav.map((n) => (
                  <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-paper">
                    {n.label}
                  </Link>
                ))}
                <span className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted">
                  Question banks <span className="chip bg-gold-soft text-[10px] text-gold">Soon</span>
                </span>
                <div className="my-1 h-px bg-line" />
                {user ? (
                  <Link href="/account" className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-paper">
                    My papers
                  </Link>
                ) : (
                  <Link href="/login" className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-paper">
                    Sign in / Create account
                  </Link>
                )}
                {admin && (
                  <Link href="/admin" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-gold hover:bg-paper">
                    Admin
                  </Link>
                )}
              </div>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
