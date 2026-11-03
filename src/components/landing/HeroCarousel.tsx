'use client';

import React, { useEffect, useState } from 'react';

// Foto slide; kalau gagal dimuat (jalur salah), tampil pengganti (ilustrasi) supaya tidak kosong.
export function PhotoSlide({ src, fallback }: { src: string; fallback: React.ReactNode }) {
  const [bad, setBad] = useState(false);
  if (bad) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" onError={() => setBad(true)} className="absolute inset-0 w-full h-full object-cover" />;
}

// Slideshow latar kartu hero: pudar halus tiap beberapa detik, titik penanda bisa diklik.
// Berhenti saat kursor di atasnya atau tab tidak terlihat; tidak berputar jika pengguna memilih "kurangi animasi".
export default function HeroCarousel({ slides, intervalMs = 5000 }: { slides: React.ReactNode[]; intervalMs?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  useEffect(() => {
    if (n < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer: number | undefined;
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      stop();
      timer = window.setInterval(() => setI((v) => (v + 1) % n), Math.max(2500, intervalMs));
    };
    const onVis = () => (document.visibilityState === 'visible' ? start() : stop());
    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [n, paused, intervalMs]);

  return (
    <div className="absolute inset-0" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((s, k) => (
        <div key={k} aria-hidden={k !== i} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${k === i ? 'opacity-100' : 'opacity-0'}`}>
          {s}
        </div>
      ))}
      {n > 1 && (
        <div className="absolute z-20 right-3 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          {slides.map((_, k) => (
            <button
              key={k}
              type="button"
              aria-label={`Tampilkan slide ${k + 1}`}
              onClick={() => setI(k)}
              className={`w-2.5 rounded-full transition-all duration-300 ${k === i ? 'h-7 bg-white' : 'h-2.5 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
