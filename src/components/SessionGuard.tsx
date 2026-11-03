"use client";

import { useEffect } from "react";

// Kalau server bilang sesi sudah tidak berlaku (401) -- mis. password diganti dari perangkat lain,
// akun dinonaktifkan, atau sesi dicabut -- arahkan ke halaman login alih-alih membiarkan layar kosong.
export default function SessionGuard() {
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await original(...args);
      try {
        const input = args[0];
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (
          res.status === 401 &&
          url.includes("/api/") &&
          !url.includes("/api/auth/login") &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      } catch {
        /* abaikan */
      }
      return res;
    };
    return () => {
      window.fetch = original;
    };
  }, []);
  return null;
}
