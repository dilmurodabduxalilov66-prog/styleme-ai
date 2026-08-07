'use client';

import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-canvas">
      {/* Orb 1: Primary Purple */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/40 blur-[100px] animate-blob mix-blend-screen opacity-100" />
      
      {/* Orb 2: Deep Indigo / Analogous Purple */}
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/30 blur-[120px] animate-blob animation-delay-2000 mix-blend-screen opacity-100" />
      
      {/* Orb 3: Soft Violet */}
      <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-primary/20 blur-[150px] animate-blob animation-delay-4000 mix-blend-screen opacity-80" />

      {/* Grid overlay for texture */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02MCAwaC0xdjYwaDFWME0wIDYwVjU5aDYwdjFIMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPgo8L3N2Zz4=')] opacity-30" />
    </div>
  );
}
