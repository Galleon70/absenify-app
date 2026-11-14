// src/components/landing/LandingNav.tsx
'use client';

import React, { useEffect, useState } from 'react';

export const NAV: [string, string][] = [
  ['tentang', 'Tentang'],
  ['fitur', 'Fitur'],
  ['paket', 'Paket'],
  ['cara-kerja', 'Cara Kerja'],
  ['tanya-jawab', 'FAQ'],
];

function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  window.history.replaceState(null, '', window.location.pathname);
}

export function SmoothLink({ id, className, children, style }: { id: string; className?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <a
      href={`#${id}`}
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        goTo(id);
      }}
    >
      {children}
    </a>
  );
}

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

  if (variant === 'desktop') {
    return (
      <nav aria-label="Menu halaman" className="hidden lg:flex items-center gap-5 text-xs font-semibold">
        {NAV.map(([id, label]) => {
          const isActive = active === id;
          return (
            <SmoothLink
              key={id}
              id={id}
              style={{
                color: isActive ? '#fcd34d' : '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}
              className="transition-all hover:opacity-75 whitespace-nowrap"
            >
              {label}
            </SmoothLink>
          );
        })}
      </nav>
    );
  }

  // Mobile horizontal scroll pill
  return (
    <nav
      aria-label="Menu halaman mobile"
      className="flex md:hidden items-center gap-1.5 overflow-x-auto py-1 scrollbar-none"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {NAV.map(([id, label]) => {
        const isActive = active === id;
        return (
          <SmoothLink
            key={id}
            id={id}
            style={{
              color: isActive ? '#0f172a' : '#ffffff',
            }}
            className={`whitespace-nowrap text-[11px] font-bold px-3 py-1 rounded-full transition-all shrink-0 ${
              isActive ? 'bg-amber-300 shadow-sm' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {label}
          </SmoothLink>
        );
      })}
    </nav>
  );
}