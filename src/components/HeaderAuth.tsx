"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Icon } from "./Icon";

/**
 * Signed-in state for the header, read in the browser from the saved session (no server round trip),
 * so every page can be cached and opens instantly.
 */
function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(isSupabaseConfigured ? null : false);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

export function HeaderActions() {
  const signedIn = useSignedIn();
  if (signedIn) {
    return (
      <Link href="/account" className="btn btn-outline !py-2 text-sm">
        <Icon name="download" className="h-4 w-4" /> My papers
      </Link>
    );
  }
  return (
    <>
      <Link
        href="/login"
        className={`hidden text-sm font-semibold text-ink-soft hover:text-ink sm:inline ${signedIn === null ? "invisible" : ""}`}
      >
        Sign in
      </Link>
      <Link href="/papers" className="btn btn-primary !py-2 text-sm">
        Shop papers
      </Link>
    </>
  );
}

export function MobileMenu({ nav }: { nav: { href: string; label: string }[] }) {
  const signedIn = useSignedIn();
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  // Close the menu after navigating, and when tapping outside it.
  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const closeNow = () => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <details ref={ref} className="relative lg:hidden">
      <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-line bg-white" aria-label="Open menu">
        <Icon name="menu" className="h-5 w-5" />
      </summary>
      <div className="card absolute right-0 mt-2 w-60 p-2">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} onClick={closeNow} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-paper">
            {n.label}
          </Link>
        ))}
        <span className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted">
          Question banks <span className="chip bg-gold-soft text-[10px] text-gold">Soon</span>
        </span>
        <div className="my-1 h-px bg-line" />
        {signedIn ? (
          <Link href="/account" onClick={closeNow} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-paper">
            My papers
          </Link>
        ) : (
          <Link href="/login" onClick={closeNow} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-paper">
            Sign in / Create account
          </Link>
        )}
      </div>
    </details>
  );
}
