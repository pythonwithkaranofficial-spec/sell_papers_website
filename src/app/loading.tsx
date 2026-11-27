// Shown instantly while a page that needs fresh data (e.g. a subject page or My papers) is loading,
// so every click gets an immediate response.
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-gold-soft">
        <div className="h-full w-1/3 animate-[loadbar_1s_ease-in-out_infinite] bg-gold" />
      </div>
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-14 sm:px-6">
        <div className="h-3 w-40 rounded bg-paper-deep" />
        <div className="mt-6 h-10 w-2/3 max-w-xl rounded-lg bg-paper-deep" />
        <div className="mt-4 h-4 w-1/2 max-w-md rounded bg-paper-deep" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 rounded-2xl border border-line bg-white" />
          ))}
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
