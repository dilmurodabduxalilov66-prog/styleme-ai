'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Home, MapPin, ScanLine, User } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function MobileNav() {
  const pathname = usePathname();

  const items = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Qidiruv', href: '/barbers', icon: MapPin },
    { name: 'Scanner', href: '/tryon', icon: ScanLine, isFab: true },
    { name: 'Chipta', href: '/ticket', icon: Calendar },
    { name: 'Profil', href: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-border-glass h-16 px-4">
      <div className="flex h-full items-center justify-around relative">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isFab) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center justify-center -translate-y-4 h-14 w-14 rounded-full bg-primary hover:bg-primary-hover text-white shadow-glow-purple border-4 border-canvas transition-all duration-150 active:scale-90"
                aria-label="Launch AI Scanner"
              >
                <Icon className="h-6 w-6 animate-pulse" />
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-lg text-text-muted transition-colors duration-150",
                isActive ? "text-primary" : "hover:text-text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
