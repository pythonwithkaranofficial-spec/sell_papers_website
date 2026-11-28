export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#0d0d0d" />
      <path d="M12 11h11l5 5v13a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2Z" fill="#ffffff" />
      <path d="M23 11v5h5" fill="none" stroke="#00a651" strokeWidth="1.6" />
      <path d="M14 20h10M14 24h10M14 28h6" stroke="#3b3b3b" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="29" cy="29" r="5" fill="#cef993" />
      <path d="m26.8 29 1.6 1.6 3-3.2" fill="none" stroke="#0d0d0d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
