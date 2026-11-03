// Ilustrasi gedung sekolah transparan untuk latar beranda (gambar asli buatan sendiri, tanpa masalah hak cipta).
export default function HeroArt() {
  return (
    <svg
      aria-hidden="true"
      viewBox="-400 0 2000 420"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-x-0 bottom-0 w-full h-[44%] pointer-events-none"
    >
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.55" />
          <stop offset="1" stopColor="#4338ca" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      {/* tanah */}
      <rect x="-400" y="372" width="2000" height="48" fill="#6366f1" opacity="0.3" />
      {/* bangunan utama */}
      <g fill="url(#hg)">
        <rect x="380" y="200" width="440" height="172" />
        <polygon points="360,200 600,110 840,200" />
        <rect x="270" y="262" width="110" height="110" />
        <rect x="820" y="262" width="110" height="110" />
        <rect x="290" y="236" width="70" height="26" />
        <rect x="840" y="236" width="70" height="26" />
      </g>
      {/* jendela */}
      <g fill="#ffffff" opacity="0.85">
        {[410, 478, 546, 654, 722, 760].map((x) => (
          <rect key={x} x={x} y="226" width="34" height="46" rx="3" />
        ))}
        {[298, 330, 850, 882].map((x) => (
          <rect key={x} x={x} y="290" width="22" height="34" rx="2" />
        ))}
        {[410, 478, 722, 760].map((x) => (
          <rect key={`b${x}`} x={x} y="298" width="34" height="46" rx="3" />
        ))}
      </g>
      {/* pintu dan lambang */}
      <rect x="572" y="296" width="56" height="76" rx="4" fill="#ffffff" opacity="0.9" />
      <circle cx="600" cy="164" r="16" fill="#ffffff" opacity="0.9" />
      {/* tiang bendera */}
      <g stroke="#4338ca" strokeOpacity="0.7" strokeWidth="4">
        <line x1="1010" y1="372" x2="1010" y2="200" />
      </g>
      <polygon points="1012,204 1068,218 1012,234" fill="#ef4444" opacity="0.6" />
      {/* pohon */}
      <g fill="#10b981" opacity="0.5">
        <circle cx="150" cy="318" r="44" />
        <circle cx="205" cy="338" r="32" />
        <circle cx="1090" cy="326" r="40" />
        <circle cx="1140" cy="344" r="28" />
      </g>
      <g fill="#4338ca" opacity="0.4">
        <rect x="144" y="340" width="12" height="32" />
        <rect x="1084" y="346" width="12" height="26" />
      </g>
    </svg>
  );
}
