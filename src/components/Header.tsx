// src/components/Header.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, CheckCheck, Loader2, KeyRound } from 'lucide-react';
import { NotificationItem } from '@/types';

interface HeaderProps {
  currentRole: string;
  notifications?: NotificationItem[];
  hideNotifications?: boolean;
  currentUser?: {
    name: string;
    email: string;
    role: string;
  };
  onLogout?: () => void;
  onRoleChange?: (role: any) => void;
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

export default function Header({
  currentRole,
  notifications = [],
  hideNotifications = false,
  currentUser,
  onLogout,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: HeaderProps) {
  const router = useRouter();
  const [showNotif, setShowNotif] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Tutup panel notifikasi saat klik di luar panel atau tekan Escape
  useEffect(() => {
    if (!showNotif) return;
    const onClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotif(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [showNotif]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Panggil API logout untuk hapus cookie di backend
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error saat logout:', err);
    } finally {
      // 2. Arahkan kembali ke halaman login & refresh state
      if (onLogout) onLogout();
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <header className="bg-indigo-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-xl border border-white/20">
            SS
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">SmartSchool</h1>
            <p className="text-[11px] text-indigo-200 mt-0.5">Attendance</p>
          </div>
        </div>

        {/* Menu Kanan */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Panel Notifikasi */}
          {!hideNotifications && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors relative"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5 text-indigo-100" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-indigo-600 animate-pulse" />
              )}
            </button>

            {showNotif && (
              <div className="fixed left-3 right-3 top-[4.25rem] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 text-gray-800 z-50 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Notifikasi</span>
                  {unreadCount > 0 && onMarkAllNotificationsRead && (
                    <button
                      onClick={() => onMarkAllNotificationsRead()}
                      className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Tandai Semua Dibaca</span>
                    </button>
                  )}
                </div>
                <div className="max-h-[60vh] sm:max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-center text-gray-400">Tidak ada notifikasi</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead && onMarkNotificationRead(n.id)}
                        className={`p-3 text-xs cursor-pointer hover:bg-gray-50 transition-colors ${
                          !n.read ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <p className="font-semibold text-gray-800">{n.title}</p>
                        <p className="text-gray-500 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Tombol Ganti Password */}
          <button
            onClick={() => router.push('/change-password')}
            className="p-2 hover:bg-white/10 text-indigo-100 rounded-xl transition-colors flex items-center justify-center"
            title="Ganti Password"
          >
            <KeyRound className="w-5 h-5" />
          </button>

          {/* Tombol Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-2 hover:bg-rose-500/20 text-indigo-100 hover:text-rose-200 rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
            title="Keluar"
          >
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}