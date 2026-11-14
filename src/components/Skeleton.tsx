// src/components/Skeleton.tsx
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-lg bg-slate-200/70 ${className}`}
      aria-hidden="true"
    />
  );
}

// Komponen khusus untuk loading baris tabel (User, Kelas, Guru, Siswa, Izin)
export function TableRowSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-slate-100">
          {Array.from({ length: columns }).map((__, colIdx) => (
            <td key={colIdx} className="p-3.5">
              <Skeleton
                className={`h-4 ${
                  colIdx === 0
                    ? 'w-32'
                    : colIdx === columns - 1
                    ? 'w-16 mx-auto'
                    : 'w-24'
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}