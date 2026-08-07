'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, LogIn, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  const links = [
    { name: 'Qanday ishlaydi', href: '/#how-it-works' },
    { name: 'Sartaroshlar', href: '/#marketplace' },
    { name: 'Reyting', href: '/#ranking' },
    { name: 'FAQ', href: '/#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-border-glass backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-glow-purple">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-text-primary">
            StyleMe <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors duration-150"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* CTA Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href={
                  user?.role === 'USER'
                    ? '/dashboard'
                    : user?.role === 'BARBER'
                    ? '/schedule'
                    : user?.role === 'ADMIN'
                    ? '/triage'
                    : '/bi'
                }
                className="flex items-center gap-2 rounded-md bg-surface px-4 h-9 text-sm font-semibold text-text-primary border border-border-glass hover:bg-border-base transition-all duration-150"
              >
                <User className="h-4 w-4 text-primary" />
                <span>Kabinet</span>
              </Link>
              <button
                onClick={() => {
                  useAuthStore.getState().clearAuth();
                  window.location.href = '/login';
                }}
                className="flex items-center gap-2 rounded-md bg-danger/10 hover:bg-danger/20 px-4 h-9 text-sm font-semibold text-danger border border-danger/20 transition-all duration-150"
              >
                <LogOut className="h-4 w-4" />
                <span>Chiqish</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-md bg-primary hover:bg-primary-hover px-4 h-9 text-sm font-semibold text-white shadow-glow-purple transition-all duration-150 active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              <span>Kirish</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
