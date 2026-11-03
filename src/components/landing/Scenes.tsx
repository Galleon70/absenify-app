// Ilustrasi bawaan untuk slide beranda (buatan sendiri, bebas hak cipta). Ganti dengan foto lewat `heroImages` di site-config.ts.
const BOX = { viewBox: '0 0 1600 700', preserveAspectRatio: 'xMidYMid slice', className: 'absolute inset-0 w-full h-full', 'aria-hidden': true } as const;

export function SceneSekolah() {
  return (
    <svg {...BOX}>
      <defs>
        <linearGradient id="s1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7d2fe" /><stop offset="0.65" stopColor="#fbcfe8" /><stop offset="1" stopColor="#fde68a" />
        </linearGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#s1)" />
      <circle cx="1230" cy="170" r="80" fill="#fff" opacity="0.65" />
      <rect y="560" width="1600" height="140" fill="#818cf8" opacity="0.55" />
      <polygon points="880,320 1175,190 1470,320" fill="#3730a3" />
      <rect x="900" y="320" width="550" height="240" fill="#4f46e5" />
      <rect x="800" y="400" width="110" height="160" fill="#6366f1" />
      <rect x="1440" y="400" width="110" height="160" fill="#6366f1" />
      <g fill="#fff" opacity="0.9">
        {[940, 1020, 1100, 1250, 1330, 1400].map((x) => <rect key={x} x={x} y="350" width="46" height="62" rx="4" />)}
        {[940, 1020, 1330, 1400].map((x) => <rect key={`b${x}`} x={x} y="440" width="46" height="62" rx="4" />)}
        <rect x="1148" y="430" width="56" height="130" rx="5" />
        <circle cx="1175" cy="262" r="22" />
      </g>
      <line x1="1580" y1="560" x2="1580" y2="300" stroke="#4338ca" strokeWidth="6" />
      <polygon points="1580,304 1500,326 1580,350" fill="#ef4444" opacity="0.8" />
      <g fill="#10b981" opacity="0.6"><circle cx="740" cy="500" r="56" /><circle cx="680" cy="530" r="40" /><circle cx="1000" cy="610" r="0" /></g>
    </svg>
  );
}

export function SceneKelas() {
  return (
    <svg {...BOX}>
      <defs>
        <linearGradient id="s2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fef3c7" /><stop offset="1" stopColor="#c7d2fe" />
        </linearGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#s2)" />
      <rect y="540" width="1600" height="160" fill="#a78bfa" opacity="0.45" />
      <rect x="860" y="90" width="620" height="330" rx="18" fill="#92400e" opacity="0.85" />
      <rect x="880" y="110" width="580" height="290" rx="10" fill="#166534" opacity="0.92" />
      <g stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.85" fill="none">
        <line x1="930" y1="170" x2="1180" y2="170" /><line x1="930" y1="230" x2="1120" y2="230" /><line x1="930" y1="290" x2="1220" y2="290" />
        <polyline points="1290,180 1320,215 1385,150" stroke="#86efac" />
        <polyline points="1290,260 1320,295 1385,230" stroke="#86efac" />
      </g>
      {[760, 1010, 1260].map((x) => (
        <g key={x} opacity="0.9">
          <rect x={x} y="470" width="190" height="16" rx="6" fill="#6366f1" />
          <rect x={x + 14} y="486" width="10" height="70" fill="#4338ca" /><rect x={x + 166} y="486" width="10" height="70" fill="#4338ca" />
          <rect x={x + 40} y="520" width="110" height="12" rx="5" fill="#a5b4fc" />
        </g>
      ))}
      <circle cx="1530" cy="60" r="34" fill="#fff" opacity="0.8" /><line x1="1530" y1="60" x2="1530" y2="40" stroke="#4338ca" strokeWidth="5" /><line x1="1530" y1="60" x2="1546" y2="66" stroke="#4338ca" strokeWidth="5" />
    </svg>
  );
}

// QR bergaya (hiasan saja, bukan QR sungguhan)
const QR = Array.from({ length: 11 }, (_, i) => Array.from({ length: 11 }, (_, j) => ((i * 7 + j * 13 + i * j) % 3 === 0 ? 1 : 0)));

export function SceneQR() {
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="56" height="56" fill="#1e1b4b" /><rect x={x + 9} y={y + 9} width="38" height="38" fill="#fff" /><rect x={x + 19} y={y + 19} width="18" height="18" fill="#1e1b4b" />
    </g>
  );
  return (
    <svg {...BOX}>
      <defs>
        <linearGradient id="s3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e0e7ff" /><stop offset="1" stopColor="#ddd6fe" />
        </linearGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#s3)" />
      <circle cx="1050" cy="350" r="300" fill="#fff" opacity="0.35" />
      <rect x="1000" y="70" width="360" height="560" rx="48" fill="#1e1b4b" />
      <rect x="1018" y="108" width="324" height="484" rx="32" fill="#fff" />
      <g transform="translate(1046 190)">
        {QR.map((r, i) => r.map((c, j) => (c && !((i < 3 && j < 3) || (i < 3 && j > 7) || (i > 7 && j < 3)) ? <rect key={`${i}-${j}`} x={j * 25} y={i * 25} width="22" height="22" fill="#4338ca" /> : null)))}
        {finder(0, 0)}{finder(219, 0)}{finder(0, 219)}
      </g>
      <g stroke="#10b981" strokeWidth="10" fill="none" strokeLinecap="round">
        <path d="M960 150 v-50 h50" /><path d="M1400 150 v-50 h-50" /><path d="M960 560 v50 h50" /><path d="M1400 560 v50 h-50" />
      </g>
      <circle cx="1340" cy="560" r="52" fill="#10b981" /><polyline points="1316,560 1334,580 1366,540" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SceneDashboard() {
  const bars = [60, 90, 70, 120, 100, 150, 130];
  return (
    <svg {...BOX}>
      <defs>
        <linearGradient id="s4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fae8ff" /><stop offset="1" stopColor="#c7d2fe" />
        </linearGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#s4)" />
      <rect x="840" y="110" width="600" height="380" rx="22" fill="#1e1b4b" />
      <rect x="860" y="130" width="560" height="340" rx="12" fill="#fff" />
      <rect x="700" y="490" width="840" height="26" rx="13" fill="#4338ca" opacity="0.8" />
      <g transform="translate(900 170)">
        {bars.map((h, i) => <rect key={i} x={i * 48} y={190 - h} width="30" height={h} rx="6" fill={i === 5 ? '#4f46e5' : '#a5b4fc'} />)}
        <line x1="0" y1="194" x2="330" y2="194" stroke="#c7d2fe" strokeWidth="3" />
      </g>
      <g transform="translate(1290 250)">
        <circle r="62" fill="none" stroke="#e0e7ff" strokeWidth="26" />
        <circle r="62" fill="none" stroke="#10b981" strokeWidth="26" strokeDasharray="330 400" transform="rotate(-90)" strokeLinecap="round" />
      </g>
      <rect x="1360" y="150" width="120" height="14" rx="7" fill="#c7d2fe" /><rect x="1360" y="176" width="80" height="14" rx="7" fill="#e0e7ff" />
    </svg>
  );
}

export const SCENES = [SceneSekolah, SceneKelas, SceneQR, SceneDashboard];
