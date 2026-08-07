'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "Mening yuklagan rasmlarim xavfsiz saqlanadimi?",
      answer: "Albatta. Biz shaxsiy daxlsizlikni juda qadrlaymiz. Mehmon rejimida yuklangan barcha rasmlar tahlil tugagandan so'ng 24 soat ichida S3 bulutli serverlarimizdan butunlay o'chiriladi. Ro'yxatdan o'tgan foydalanuvchilar rasmlari esa ularning shaxsiy kabinetida shifrlangan holatda saqlanadi."
    },
    {
      question: "AI tavsiyalari va soch sinash bepulmi?",
      answer: "Ha, yuz shaklini aniqlash va turli soch turmaklarini o'z rasmingizda sinab ko'rish mutlaqo bepul. Siz faqat o'zingiz tanlagan sartaroshxonadagi haqiqiy soch kesish xizmati uchun to'lov qilasiz."
    },
    {
      question: "Sartaroshxonaga yozilishni bekor qilsam, pulim qaytariladimi?",
      answer: "Ha, platformamizda bekor qilish mutlaqo bepul. Agar band qilingan uchrashuv vaqtidan kamida 2 soat oldin bekor qilsangiz, to'langan mablag' 100% miqdorda kartangizga yoki platformadagi balansingizga avtomatik ravishda qaytariladi."
    },
    {
      question: "Sartarosh sifatida qanday ro'yxatdan o'taman?",
      answer: "Platformadagi \"Sartarosh Bo'lish\" tugmasini bosing, portfolioingizni yuklang va ish jadvalingizni belgilang. Bizning administratorlar sertifikatingiz va hujjatlaringizni tekshirib tasdiqlagach, mijozlarni qabul qilishni boshlashingiz mumkin."
    }
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="rounded-xl border border-border-glass bg-surface/50 overflow-hidden transition-all duration-150"
          >
            <button
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between p-5 text-left font-semibold text-text-primary hover:bg-border-glass transition-colors duration-150 focus:outline-none"
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-text-muted shrink-0" />
              )}
            </button>
            <div
              className={cn(
                "transition-all duration-200 ease-in-out overflow-hidden",
                isOpen ? "max-h-60 border-t border-border-glass p-5 bg-canvas/30" : "max-h-0"
              )}
            >
              <p className="text-sm text-text-muted leading-relaxed">{faq.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
