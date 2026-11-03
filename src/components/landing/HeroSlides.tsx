'use client';

import { useEffect, useRef, useState } from 'react';
import HeroArt from './HeroArt';

// Latar beranda berupa beberapa foto yang bergantian otomatis dengan pudar halus (crossfade).
// Foto yang gagal dimuat (salah nama/jalur) dilewati; kalau semuanya gagal, tampil ilustrasi bawaan.
// Berhenti saat tab tidak terlihat, dan tidak berputar kalau pengguna memilih "kurangi animasi".
export default function HeroSlides({ images, intervalMs = 5000 }: { images: string[]; intervalMs?: number }) {
  const [i, setI] = useState(0);
  const [bad, setBad] = useState<string[]>([]);
  const box = useRef<HTMLDivElement>(null);

  const usable = images.filter((s) => !bad.includes(s));
  const count = usable.length;

  // Gambar yang sudah gagal sebelum halaman "hidup" tidak memicu onError, jadi diperiksa manual.
  useEffect(() => {
    const failed: string[] = [];
    box.current?.querySelectorAll('img').forEach((img) => {
      if (img.complete && img.naturalWidth === 0) failed.push(img.getAttribute('src') || '');
    });
    if (failed.length) setBad((b) => Array.from(new Set([...b, ...failed])));
  }, []);

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer: number | undefined;
    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      stop();
      timer = window.setInterval(() => setI((v) => v + 1), Math.max(2500, intervalMs));
    };
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [count, intervalMs]);

  if (images.length > 0 && count === 0) return <HeroArt />;

  const current = count > 0 ? i % count : 0;
  return (
    <div ref={box} aria-hidden="true" className="absolute inset-0">
      {images.map((src, n) => {
        const idx = usable.indexOf(src);
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${n}`}
            src={src}
            alt=""
            loading={n === 0 ? 'eager' : 'lazy'}
            onError={() => setBad((b) => (b.includes(src) ? b : [...b, src]))}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === current && idx !== -1 ? 'opacity-25' : 'opacity-0'}`}
          />
        );
      })}
    </div>
  );
}
