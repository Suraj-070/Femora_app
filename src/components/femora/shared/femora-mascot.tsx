export function FemoraMascot({ className = "w-14 h-14" }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" className="w-full h-full animate-mascot-breathe" aria-hidden>
        <defs>
          <linearGradient id="mascotGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d5c" />
          </linearGradient>
        </defs>
        {/* heart body */}
        <path
          fill="url(#mascotGradient)"
          d="M50 88 41 80.2C21 62 8 50.4 8 36 8 24.3 17.3 15 29 15c6.7 0 13.1 3.1 17 8
             3.9-4.9 10.3-8 17-8 11.7 0 21 9.3 21 21 0 14.4-13 26-33 44.2L50 88z"
        />
        {/* face group */}
        <g>
          {/* eyes */}
          <ellipse cx="39" cy="42" rx="3.2" ry="4" fill="white" className="animate-mascot-blink" />
          <ellipse cx="61" cy="42" rx="3.2" ry="4" fill="white" className="animate-mascot-blink" />
          {/* soft smile */}
          <path
            d="M38 54c3.5 4 8 6 12 6s8.5-2 12-6"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* blush */}
          <ellipse cx="30" cy="50" rx="4" ry="2.5" fill="white" opacity="0.35" />
          <ellipse cx="70" cy="50" rx="4" ry="2.5" fill="white" opacity="0.35" />
        </g>
      </svg>
    </div>
  );
}