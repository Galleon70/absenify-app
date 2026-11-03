// src/app/robots.ts
import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site-config';

// Halaman publik (beranda) boleh dibaca Google; aplikasi (login dan dashboard) tetap tertutup.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin', '/owner', '/teacher', '/parent', '/principal', '/student', '/scan', '/login', '/register', '/change-password'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
