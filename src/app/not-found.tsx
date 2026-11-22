import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center">
      <p className="font-display text-6xl font-semibold text-gold">404</p>
      <h1 className="font-display mt-4 text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-muted">The page you are looking for does not exist.</p>
      <Link href="/" className="btn btn-primary mt-8">Back to home</Link>
    </div>
  );
}
