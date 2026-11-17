"use client";

import React, { useState, useEffect } from "react";
import { Key, X, Check, ExternalLink, ShieldCheck, Sparkles, Cpu } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
}

export function ApiKeyModal({ isOpen, onClose, apiKey, onSaveKey }: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setKeyInput(apiKey);
  }, [apiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleRemove = () => {
    setKeyInput("");
    onSaveKey("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-3 border-purple-200 relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-200">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800">
              إعدادات الذكاء الاصطناعي الحقيقي
            </h3>
            <p className="text-xs text-slate-500">
              ربط كروت شاشة GPU السحابية (Replicate / Stable Video Diffusion)
            </p>
          </div>
        </div>

        {/* Explanation Card */}
        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 text-xs text-purple-900 leading-relaxed mb-4 space-y-2">
          <div className="flex items-center gap-1.5 font-black text-purple-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>لماذا نحتاج هذا المفتاح؟</span>
          </div>
          <p>
            لجعل الشخصيات (كالأرنب والدب) تقفز وتلوح بيدها وتتحرك حقيقةً، نستخدم نماذج توليد
            الفيديو العصبية (Image-to-Video) التي تعمل على كروت شاشة Nvidia خارقة في السحاب.
          </p>
          <div className="pt-1">
            <a
              href="https://replicate.com/account/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-black underline underline-offset-2"
            >
              <span>احصل على مفتاح مجاني للتجربة من هنا (replicate.com)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-purple-600" />
            <span>Replicate API Token:</span>
          </label>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-sm font-mono transition-all"
          />
          <p className="text-[11px] text-slate-400">
            يتم تخزين المفتاح محلياً على جهازك بأمان ويُستخدم فقط للتواصل المباشر مع خوادم الذكاء الاصطناعي.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-purple-100">
          {keyInput && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 transition-all"
            >
              إزالة المفتاح
            </button>
          )}

          <div className="flex items-center gap-2 mr-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold transition-all"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-200 active:scale-95 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم الحفظ!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>حفظ المفتاح</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
