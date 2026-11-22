export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Policy</p>
      <h1 className="font-display mt-2 text-4xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
      <div className="prose-legal mt-8">{children}</div>
    </div>
  );
}
