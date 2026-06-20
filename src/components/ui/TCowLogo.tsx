export function TCowLogo({ className = "w-full h-full", title = "T-Cow°" }: { className?: string; title?: string }) {
  return (
    <span className={className} role="img" aria-label={title} title={title}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="tcow-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8ce362" />
            <stop offset="100%" stopColor="#1a9cd8" />
          </linearGradient>
        </defs>
        <rect x="15" y="10" width="70" height="18" rx="9" fill="url(#tcow-logo-gradient)" />
        <rect x="45" y="20" width="10" height="50" rx="5" fill="url(#tcow-logo-gradient)" />
        <circle cx="50" cy="78" r="16" fill="url(#tcow-logo-gradient)" />
        <rect x="47" y="25" width="6" height="30" rx="3" fill="rgba(255,255,255,0.65)" />
      </svg>
    </span>
  );
}
