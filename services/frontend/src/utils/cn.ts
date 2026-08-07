import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Standard cn function to safely merge Tailwind utilities without style duplicates
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
