import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Kebijakan konten: hanya memuat skrip/gambar/koneksi dari aplikasi sendiri, melarang aplikasi
// ditampilkan di dalam situs lain (anti-clickjacking), dan melarang plugin.
// 'unsafe-inline' dibutuhkan Next.js untuk skrip awal; 'unsafe-eval' hanya di development.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self' blob:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Server pengembangan Next.js menolak permintaan dari alamat selain localhost. Alamat yang dipakai untuk
  // demo (VS Code Ports / Dev Tunnels, ngrok, Cloudflare Tunnel) harus didaftarkan, kalau tidak halaman
  // tampil tapi tombol dan formulir tidak berfungsi. Alamat lain: isi DEV_ORIGINS di .env (pisahkan koma).
  allowedDevOrigins: [
    "*.devtunnels.ms",
    "*.*.devtunnels.ms",
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.trycloudflare.com",
    ...(process.env.DEV_ORIGINS ? process.env.DEV_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean) : []),
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Kamera dibutuhkan scanner QR (Mode 3); mikrofon dan lokasi tidak dipakai
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        // CSP hanya untuk halaman (bukan API), supaya tampilan bukti izin (PDF/foto) tidak terganggu
        source: "/((?!api/|_next/static|_next/image|favicon.ico).*)",
        headers: [{ key: "Content-Security-Policy", value: csp }],
      },
    ];
  },
};

export default nextConfig;
