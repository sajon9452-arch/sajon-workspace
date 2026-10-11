// Clean Transparent Circular PNG/SVG Logo for সিলেট মানব সেবা সংগঠন
// 100% Transparent Background, Circular Shape, No Boxes or Borders
export const DEFAULT_TRANSPARENT_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">
  <!-- Definitions for gradients and shadows -->
  <defs>
    <linearGradient id="emeraldGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="50%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#e11d48" />
    </linearGradient>
    <linearGradient id="handGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#047857" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Circular Outer Rings (Transparent Background Behind) -->
  <circle cx="120" cy="120" r="112" fill="none" stroke="url(#emeraldGold)" stroke-width="5" stroke-dasharray="4 2" />
  <circle cx="120" cy="120" r="105" fill="none" stroke="url(#goldRing)" stroke-width="2.5" />
  <circle cx="120" cy="120" r="98" fill="none" stroke="url(#emeraldGold)" stroke-width="2" />

  <!-- Decorative Stars on Ring -->
  <path d="M 120 12 L 122 17 L 127 17 L 123 20 L 125 25 L 120 22 L 115 25 L 117 20 L 113 17 L 118 17 Z" fill="#fbbf24" />
  <path d="M 228 120 L 223 122 L 223 127 L 220 123 L 215 125 L 218 120 L 215 115 L 220 117 L 223 113 L 223 118 Z" fill="#fbbf24" />
  <path d="M 12 120 L 17 118 L 17 113 L 20 117 L 25 115 L 22 120 L 25 125 L 20 123 L 17 127 L 17 122 Z" fill="#fbbf24" />
  <path d="M 120 228 L 118 223 L 113 223 L 117 220 L 115 215 L 120 218 L 125 215 L 123 220 L 127 223 L 122 223 Z" fill="#fbbf24" />

  <!-- Circular Path for Curved Text (Top) -->
  <path id="textArcTop" d="M 28 120 A 92 92 0 0 1 212 120" fill="none" />
  <text font-size="13" font-weight="900" fill="#34d399" letter-spacing="2.5">
    <textPath href="#textArcTop" startOffset="50%" text-anchor="middle">
      সিলেট মানব সেবা সংগঠন
    </textPath>
  </text>

  <!-- Circular Path for Curved Text (Bottom) -->
  <path id="textArcBottom" d="M 212 120 A 92 92 0 0 1 28 120" fill="none" />
  <text font-size="11" font-weight="800" fill="#fbbf24" letter-spacing="2">
    <textPath href="#textArcBottom" startOffset="50%" text-anchor="middle">
      ★ স্থাপিত : ২০২২ ইং ★
    </textPath>
  </text>

  <!-- Center Emblem: Caring Hands Cradling Heart & Humanitarian Cross/Leaf -->
  <g filter="url(#glow)">
    <!-- Inner glowing circle backdrop -->
    <circle cx="120" cy="120" r="68" fill="#064e3b" fill-opacity="0.35" stroke="#10b981" stroke-width="1.5" />

    <!-- Center Radiant Rays -->
    <circle cx="120" cy="115" r="48" fill="none" stroke="#fbbf24" stroke-opacity="0.25" stroke-dasharray="3 3" />

    <!-- Two Caring Supporting Hands from sides -->
    <!-- Left Hand -->
    <path d="M 68 135 C 72 120 85 118 95 124 C 102 128 112 136 120 144 C 112 147 98 152 85 150 C 74 148 68 142 68 135 Z" fill="url(#handGrad)" opacity="0.95" />
    <path d="M 72 133 C 78 123 90 125 98 130" stroke="#059669" stroke-width="1.5" fill="none" stroke-linecap="round" />

    <!-- Right Hand -->
    <path d="M 172 135 C 168 120 155 118 145 124 C 138 128 128 136 120 144 C 128 147 142 152 155 150 C 166 148 172 142 172 135 Z" fill="url(#handGrad)" opacity="0.95" />
    <path d="M 168 133 C 162 123 150 125 142 130" stroke="#059669" stroke-width="1.5" fill="none" stroke-linecap="round" />

    <!-- Radiant Humanitarian Heart in the Center -->
    <path d="M 120 88 C 114 76 96 76 90 90 C 82 108 104 126 120 138 C 136 126 158 108 150 90 C 144 76 126 76 120 88 Z" fill="url(#heartGrad)" stroke="#fda4af" stroke-width="1.5" />

    <!-- White Humanitarian Medical / Aid Cross inside Heart -->
    <rect x="117" y="93" width="6" height="18" rx="2" fill="#ffffff" />
    <rect x="111" y="99" width="18" height="6" rx="2" fill="#ffffff" />

    <!-- Sparkles of Compassion / Hope -->
    <circle cx="106" cy="88" r="2.5" fill="#ffffff" opacity="0.8" />
    <circle cx="134" cy="88" r="2.5" fill="#ffffff" opacity="0.8" />
  </g>
</svg>
`)}`;
