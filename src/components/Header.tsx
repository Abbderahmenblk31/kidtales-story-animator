"use client";

import React from "react";
import { Sparkles, Wand2, History, Heart, Key, CheckCircle } from "lucide-react";

interface HeaderProps {
  onToggleGallery?: () => void;
  onOpenKeyModal?: () => void;
  hasApiKey?: boolean;
  historyCount?: number;
}

export function Header({
  onToggleGallery,
  onOpenKeyModal,
  hasApiKey = false,
  historyCount = 0,
}: HeaderProps) {
  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b-2 border-purple-100 sticky top-0 z-30 shadow-sm transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand & Mascot */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-400 to-amber-300 flex items-center justify-center shadow-lg shadow-purple-200 transform hover:rotate-6 transition-transform">
            <Wand2 className="w-7 h-7 text-white drop-shadow animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-700 via-pink-600 to-amber-500 bg-clip-text text-transparent">
                حكايات متحركة AI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                <Sparkles className="w-3 h-3 text-amber-600" />
                للأطفال والمبدعين
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              حوّل رسومات وقصص الأطفال الثابتة إلى كرتون ناطق ومتحرك بالسحر!
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* API Key Settings Button */}
          {onOpenKeyModal && (
            <button
              onClick={onOpenKeyModal}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 shadow-sm ${
                hasApiKey
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-amber-50 border-amber-300 text-amber-800 animate-pulse"
              }`}
              title="إعدادات مفتاح الذكاء الاصطناعي (Replicate GPU)"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{hasApiKey ? "مفتاح AI متصل" : "إعداد مفتاح AI"}</span>
              {hasApiKey && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          )}

          {/* History Gallery */}
          {onToggleGallery && (
            <button
              onClick={onToggleGallery}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs sm:text-sm border border-purple-200 transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="معرض القصص السابقة"
            >
              <History className="w-4 h-4 text-purple-600" />
              <span>قصصي السابقة</span>
              {historyCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-pink-50 text-pink-700 text-xs font-semibold border border-pink-200">
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 animate-bounce" />
            <span>آمن 100% للأطفال</span>
          </div>
        </div>
      </div>
    </header>
  );
}
