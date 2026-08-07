'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route boundary error:', error);
  }, [error]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger shadow-lg">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary mt-6">
        Xatolik yuz berdi
      </h1>
      <p className="font-sans text-sm text-text-muted mt-2 max-w-md">
        Biz tizim barqarorligini tekshirmoqdamiz. Ushbu sahifada xatolik yuzaga keldi. Iltimos, qaytadan urinib ko'ring.
      </p>
      {error.message && (
        <code className="mt-4 block rounded bg-surface border border-border-glass p-2 font-mono text-xs text-danger">
          {error.message}
        </code>
      )}
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 rounded-md bg-primary hover:bg-primary-hover text-white px-5 h-10 text-sm font-semibold shadow-glow-purple mt-8 transition-all duration-150 active:scale-95"
      >
        <RotateCcw className="h-4 w-4" />
        <span>Qayta urinish</span>
      </button>
    </div>
  );
}
