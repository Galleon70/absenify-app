// src/app/scan/page.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { ArrowLeft, Camera, CameraOff, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

type Outcome = "RECORDED" | "UPDATED" | "ALREADY" | "LEAVE";
interface ScanOk {
  studentName: string;
  className: string | null;
  status: "HADIR" | "TERLAMBAT" | "IZIN" | "SAKIT" | "ALPA";
  outcome: Outcome;
  time: string;
}
type Result = ({ kind: "ok" } & ScanOk) | { kind: "error"; message: string };
interface HistoryItem {
  id: number;
  at: string;
  name: string;
  className: string | null;
  label: string;
  tone: "green" | "amber" | "blue" | "red";
}

const COOLDOWN_MS = 4000; // kode yang sama diabaikan selama ini (supaya tidak terkirim berkali-kali)

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDecodeRef = useRef(0);
  const lastTokenRef = useRef<{ token: string; at: number }>({ token: "", at: 0 });
  const busyRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const idRef = useRef(0);

  const [running, setRunning] = useState(false);
  const [camError, setCamError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [manual, setManual] = useState("");
  const [backHref, setBackHref] = useState("/");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data?.role === "ADMIN") setBackHref("/admin/dashboard");
        else if (j?.data?.role === "TEACHER") setBackHref("/teacher/dashboard");
      })
      .catch(() => {});
  }, []);

  const beep = useCallback((tone: "green" | "amber" | "blue" | "red") => {
    try {
      const ctx = audioRef.current;
      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = tone === "green" ? 880 : tone === "amber" ? 600 : tone === "blue" ? 520 : 200;
        osc.type = "sine";
        gain.gain.value = 0.15;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + (tone === "red" ? 0.35 : 0.12));
      }
      navigator.vibrate?.(tone === "red" ? [120, 60, 120] : 60);
    } catch {
      /* suara/getar tidak tersedia, abaikan */
    }
  }, []);

  const submit = useCallback(
    async (token: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const res = await fetch("/api/attendance/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json().catch(() => ({}));
        const nowStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

        if (!res.ok || !json.success) {
          const message = json.message || "Gagal memproses scan";
          setResult({ kind: "error", message });
          setHistory((h) => [{ id: ++idRef.current, at: nowStr, name: "-", className: null, label: message, tone: "red" as const }, ...h].slice(0, 20));
          beep("red");
          return;
        }

        const d = json.data as ScanOk;
        setResult({ kind: "ok", ...d });
        let tone: HistoryItem["tone"] = "green";
        let label: string = d.status;
        if (d.outcome === "ALREADY") {
          tone = "blue";
          label = `Sudah tercatat (${d.status})`;
        } else if (d.outcome === "LEAVE") {
          tone = "blue";
          label = `Berstatus ${d.status} hari ini`;
        } else if (d.status === "TERLAMBAT") {
          tone = "amber";
        }
        setHistory((h) => [{ id: ++idRef.current, at: nowStr, name: d.studentName, className: d.className, label, tone }, ...h].slice(0, 20));
        beep(tone);
      } catch {
        setResult({ kind: "error", message: "Tidak bisa terhubung ke server" });
        beep("red");
      } finally {
        busyRef.current = false;
      }
    },
    [beep]
  );

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRunning(false);
  }, []);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const now = performance.now();
      if (now - lastDecodeRef.current > 150) {
        lastDecodeRef.current = now;
        const scale = Math.min(1, 640 / video.videoWidth);
        const w = Math.floor(video.videoWidth * scale);
        const h = Math.floor(video.videoHeight * scale);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const img = ctx.getImageData(0, 0, w, h);
          const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
          if (code?.data) {
            const last = lastTokenRef.current;
            if (code.data !== last.token || Date.now() - last.at > COOLDOWN_MS) {
              lastTokenRef.current = { token: code.data, at: Date.now() };
              submit(code.data);
            }
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [submit]);

  const start = async () => {
    setCamError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError(
        window.isSecureContext
          ? "Browser ini tidak mendukung akses kamera."
          : "Kamera hanya bisa dipakai lewat HTTPS (atau localhost). Buka aplikasi lewat alamat https://, atau pakai input manual di bawah untuk uji coba."
      );
      return;
    }
    try {
      audioRef.current = audioRef.current || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setRunning(true);
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      const name = (e as DOMException)?.name;
      setCamError(
        name === "NotAllowedError"
          ? "Izin kamera ditolak. Aktifkan izin kamera untuk situs ini di pengaturan browser."
          : name === "NotFoundError"
          ? "Kamera tidak ditemukan di perangkat ini."
          : "Tidak bisa membuka kamera."
      );
    }
  };

  useEffect(() => stop, [stop]);

  const toneCls = {
    green: "bg-emerald-50 border-emerald-300 text-emerald-800",
    amber: "bg-amber-50 border-amber-300 text-amber-800",
    blue: "bg-blue-50 border-blue-300 text-blue-800",
    red: "bg-rose-50 border-rose-300 text-rose-800",
  } as const;

  let resultTone: keyof typeof toneCls = "red";
  let resultTitle = "";
  let resultSub = "";
  if (result?.kind === "ok") {
    if (result.outcome === "ALREADY") {
      resultTone = "blue";
      resultTitle = result.studentName;
      resultSub = `Sudah tercatat: ${result.status}`;
    } else if (result.outcome === "LEAVE") {
      resultTone = "blue";
      resultTitle = result.studentName;
      resultSub = `Berstatus ${result.status} hari ini (tidak diubah)`;
    } else if (result.status === "TERLAMBAT") {
      resultTone = "amber";
      resultTitle = result.studentName;
      resultSub = `TERLAMBAT • ${result.time}`;
    } else {
      resultTone = "green";
      resultTitle = result.studentName;
      resultSub = `HADIR • ${result.time}`;
    }
  } else if (result?.kind === "error") {
    resultTone = "red";
    resultTitle = "Gagal";
    resultSub = result.message;
  }

  const counts = history.reduce(
    (a, h) => {
      if (h.tone === "green") a.hadir++;
      if (h.tone === "amber") a.terlambat++;
      return a;
    },
    { hadir: 0, terlambat: 0 }
  );

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      <header className="bg-[#4F46E5] text-white shadow-md">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href={backHref} className="p-2 -ml-2 hover:bg-white/10 rounded-xl" title="Kembali">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-base font-black leading-tight">Scanner QR Absensi</h1>
            <p className="text-[11px] text-indigo-200">Arahkan kamera ke QR di layar HP murid</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Kamera */}
        <div className="bg-black rounded-2xl overflow-hidden relative aspect-[4/3] flex items-center justify-center">
          <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${running ? "" : "hidden"}`} />
          <canvas ref={canvasRef} className="hidden" />
          {running && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-2/3 aspect-square border-2 border-white/80 rounded-2xl" />
            </div>
          )}
          {!running && (
            <div className="text-center text-white/80 px-6 space-y-3">
              <CameraOff className="w-10 h-10 mx-auto opacity-70" />
              <p className="text-xs">Kamera belum aktif</p>
            </div>
          )}
        </div>

        {camError && <p className="rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold px-3 py-2">{camError}</p>}

        {running ? (
          <button onClick={stop} className="w-full min-h-12 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
            <CameraOff className="w-4 h-4" /> Matikan Kamera
          </button>
        ) : (
          <button onClick={start} className="w-full min-h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-200">
            <Camera className="w-4 h-4" /> Nyalakan Kamera
          </button>
        )}

        {/* Hasil terakhir */}
        {result && (
          <div className={`rounded-2xl border-2 p-4 flex items-center gap-3 ${toneCls[resultTone]}`} role="status">
            {resultTone === "green" ? <CheckCircle2 className="w-9 h-9 shrink-0" /> : resultTone === "amber" ? <AlertTriangle className="w-9 h-9 shrink-0" /> : resultTone === "blue" ? <Info className="w-9 h-9 shrink-0" /> : <XCircle className="w-9 h-9 shrink-0" />}
            <div className="min-w-0">
              <p className="font-black text-lg leading-tight truncate">{resultTitle}</p>
              {result.kind === "ok" && result.className && <p className="text-xs opacity-80">{result.className}</p>}
              <p className="text-sm font-bold">{resultSub}</p>
            </div>
          </div>
        )}

        {/* Ringkasan sesi */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-emerald-50 text-emerald-700 rounded-xl py-2.5">
            <p className="text-xl font-black leading-none">{counts.hadir}</p>
            <p className="text-[10px] font-bold mt-1">HADIR (sesi ini)</p>
          </div>
          <div className="bg-amber-50 text-amber-700 rounded-xl py-2.5">
            <p className="text-xl font-black leading-none">{counts.terlambat}</p>
            <p className="text-[10px] font-bold mt-1">TERLAMBAT (sesi ini)</p>
          </div>
        </div>

        {/* Riwayat sesi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-sm mb-2">Scan terbaru</h3>
          {history.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Belum ada scan.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((h) => (
                <li key={h.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{h.name}{h.className ? ` • ${h.className}` : ""}</p>
                    <p className={`truncate ${h.tone === "red" ? "text-rose-600" : "text-gray-500"}`}>{h.label}</p>
                  </div>
                  <span className="text-gray-400 shrink-0">{h.at}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Input manual (uji coba / kamera bermasalah) */}
        <details className="bg-white rounded-2xl border border-gray-100 p-4 text-xs">
          <summary className="font-bold text-gray-600 cursor-pointer">Input manual (uji coba / kamera bermasalah)</summary>
          <div className="mt-3 flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Tempel kode QR di sini"
              className="flex-1 bg-white text-gray-900 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              onClick={() => {
                if (manual.trim()) {
                  submit(manual.trim());
                  setManual("");
                }
              }}
              className="px-4 bg-indigo-600 text-white font-bold rounded-xl"
            >
              Proses
            </button>
          </div>
        </details>
      </main>
    </div>
  );
}
