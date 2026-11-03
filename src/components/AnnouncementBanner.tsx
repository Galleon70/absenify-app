// src/components/AnnouncementBanner.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole?: string;
  target?: string;
  author?: string;
}

interface AnnouncementBannerProps {
  role?: string;
  targetRole?: string;
}

const DISMISSED_KEY = "hadirku:dismissed-announcements";

export default function AnnouncementBanner({ role, targetRole }: AnnouncementBannerProps) {
  const currentRole = (role || targetRole || "ALL").toUpperCase();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load ID dismiss dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_KEY);
      if (saved) setDismissedIds(JSON.parse(saved));
    } catch (e) {
      console.error("Gagal membaca localStorage dismiss:", e);
    }
  }, []);

  // Fetch Pengumuman & Otomatis Bersihkan ID Sampah
  useEffect(() => {
    let isMounted = true;
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const json = await res.json();
          const list = json.data || json.announcements || json || [];
          if (isMounted && Array.isArray(list)) {
            setAnnouncements(list);

            // AUTO-CLEANUP: Hapus ID dari localStorage jika pengumuman tersebut sudah tidak ada di DB
            const activeDbIds = new Set(list.map((a: Announcement) => String(a.id)));
            setDismissedIds((prevDismissed) => {
              const cleaned = prevDismissed.filter((id) => activeDbIds.has(id));
              try {
                localStorage.setItem(DISMISSED_KEY, JSON.stringify(cleaned));
              } catch {}
              return cleaned;
            });
          }
        }
      } catch (err) {
        console.error("Gagal fetch pengumuman:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnnouncements();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = (id: string) => {
    const updated = Array.from(new Set([...dismissedIds, String(id)]));
    setDismissedIds(updated);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Gagal menyimpan dismiss ke localStorage:", e);
    }
  };

  // Filter pengumuman aktif
  const activeAnnouncements = announcements.filter((a) => {
    if (dismissedIds.includes(String(a.id))) return false;

    const rawTarget = String(a.target || a.targetRole || "ALL").toUpperCase();
    return (
      rawTarget === "ALL" ||
      rawTarget === currentRole ||
      (currentRole === "PARENT" && rawTarget.includes("PARENT")) ||
      (currentRole === "STUDENT" && rawTarget.includes("STUDENT")) ||
      (currentRole === "TEACHER" && rawTarget.includes("TEACHER"))
    );
  });

  if (loading || activeAnnouncements.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      {activeAnnouncements.map((item) => (
        <div
          key={item.id}
          className="relative flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm transition-all"
        >
          <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
            <Megaphone className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h4 className="font-bold text-sm leading-snug text-amber-950">
              {item.title}
            </h4>
            <p className="text-xs text-amber-800 mt-1 whitespace-pre-line">
              {item.content}
            </p>
            {item.author && (
              <p className="text-[10px] font-semibold text-amber-600 mt-2 uppercase tracking-wider">
                Oleh: {item.author}
              </p>
            )}
          </div>

          <button
            onClick={() => handleDismiss(String(item.id))}
            title="Tutup pengumuman ini"
            className="absolute top-3 right-3 p-1.5 text-amber-600 hover:text-amber-950 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}