'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, Sparkles } from 'lucide-react';

export default function AIDemoSlider() {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 - 100)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div 
        ref={containerRef}
        className="relative w-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden border border-border-glass shadow-premium select-none cursor-ew-resize"
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        {/* Before Image (Left Side) */}
        <img 
          src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600&h=800" 
          alt="Before haircut styling" 
          className="absolute inset-0 w-full h-full object-cover"
          draggable="false"
        />
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-border-glass">
          Hozirgi holat
        </div>

        {/* After Image (Right Side, clipped) */}
        <div 
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}
        >
          <img 
            src="/hero_user.png" 
            alt="AI recommended fade haircut" 
            className="absolute inset-0 w-full h-full object-cover"
            draggable="false"
          />
          <div className="absolute top-4 right-4 bg-primary/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-primary-glow flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span>AI Tavsiyasi</span>
          </div>
        </div>

        {/* Slider Divider Line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Slider Handle Button */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white border-2 border-white shadow-glow-purple cursor-grab active:cursor-grabbing pointer-events-auto">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
        </div>
      </div>
      <p className="text-xs text-text-muted italic">
        Slayderni suring va AI soch turmagi sifatini solishtiring
      </p>
    </div>
  );
}
