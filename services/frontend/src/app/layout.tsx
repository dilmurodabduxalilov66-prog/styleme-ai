import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import QueryProvider from "@/lib/query-client";
import AnimatedBackground from "@/components/AnimatedBackground";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StyleMe AI - AI-powered Hairstyle Try-On & Barber Marketplace",
  description: "Discover the perfect hairstyle matching your face shape using AI, and book a verified local barber instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-text-primary font-sans">
        <AnimatedBackground />
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
