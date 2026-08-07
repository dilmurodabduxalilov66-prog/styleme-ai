import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-glow-purple">
        <HelpCircle className="h-8 w-8" />
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary mt-6">
        Sahifa topilmadi
      </h1>
      <p className="font-sans text-sm text-text-muted mt-2 max-w-md">
        Siz qidirayotgan sahifa o'chirilgan, nomi o'zgartirilgan yoki vaqtincha mavjud emas bo'lishi mumkin.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-md bg-surface border border-border-glass hover:bg-border-base text-text-primary px-5 h-10 text-sm font-semibold transition-all duration-150 mt-8 active:scale-95"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Bosh sahifaga qaytish</span>
      </Link>
    </div>
  );
}
