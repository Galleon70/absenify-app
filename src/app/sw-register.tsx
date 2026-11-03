'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW Registered dengan scope:', reg.scope))
        .catch((err) => console.error('SW Gagal Register:', err));
    }
  }, []);

  return null;
}