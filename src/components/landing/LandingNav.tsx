'use client';

import React, { useEffect, useState } from 'react';

export const NAV: [string, string][] = [
  ['tentang', 'Tentang'],
  ['fitur', 'Fitur'],
  ['paket', 'Paket'],
  ['cara-kerja', 'Cara Kerja'],
  ['tanya-jawab', 'FAQ'],
];

// Loncat halus ke bagian halaman tanpa mengubah URL (alamat tetap bersih). Menghormati pengaturan "kurangi animasi".
function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  window.history.replaceState(null, '', window.location.pathname);
}

export function SmoothLink({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={`#${id}`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        goTo(id);
      }}
    >
      {children}
    </a>
  );
}

// Menu atas: menandai bagian yang sedang dilihat dengan garis bawah beranimasi.
export default function NavLinks({ variant }: { variant: 'desktop' | 'mobile' }) {
  const [active, setActive] = useState('');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-35% 0px -60% 0px' }
    );
    NAV.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const base =
    'relative font-semibold transition-colors duration-200 active:scale-95 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-indigo-600 after:transition-all after:duration-300';

  return (
    <nav
      aria-label="Menu halaman"
      className={variant === 'desktop' ? 'hidden md:flex items-center gap-7 text-sm' : 'md:hidden flex items-center gap-6 text-sm overflow-x-auto px-4 pb-3'}
    >
      {NAV.map(([id, label]) => (
        <SmoothLink
          key={id}
          id={id}
          className={`${base} whitespace-nowrap ${active === id ? 'text-indigo-700 after:w-full' : 'text-gray-600 hover:text-indigo-700 after:w-0 hover:after:w-full'}`}
        >
          {label}
        </SmoothLink>
      ))}
    </nav>
  );
}
