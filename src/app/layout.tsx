import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import SessionGuard from '@/components/SessionGuard';

export const metadata: Metadata = {
  title: 'Absenify - Sistem Presensi & Kehadiran Sekolah',
  description: 'Sistem Presensi & Manajemen Kehadiran Siswa Modern',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Absenify',
  },
  formatDetection: {
    telephone: false,
  },
  // Aplikasi berisi data siswa -> jangan tampil di hasil pencarian Google.
  // TODO saat deploy: halaman depan publik boleh diindeks (lihat juga src/app/robots.ts).
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // supaya area aman (notch / bar bawah HP) bisa dipakai
  // Zoom sengaja TIDAK dikunci: orang tua/guru yang butuh tulisan besar tetap bisa zoom.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      {/* Diubah bg-[#f8fafc] menjadi bg-[#0b0f19] dan teks menjadi terang */}
      <body className="antialiased bg-[#0b0f19] text-slate-100 min-h-screen m-0 p-0">
        <SessionGuard />
        {children}

        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').then(
                function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                },
                function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                }
              );
            }
          `}
        </Script>
      </body>
    </html>
  );
}