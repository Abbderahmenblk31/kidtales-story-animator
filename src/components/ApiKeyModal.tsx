"use client";

import React, { useState, useEffect } from "react";
import { Key, X, Check, ExternalLink, ShieldCheck, Sparkles, Zap, Cpu } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  hfToken: string;
  replicateToken: string;
  onSaveTokens: (hf: string, replicate: string) => void;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  hfToken,
  replicateToken,
  onSaveTokens,
}: ApiKeyModalProps) {
  const [hfInput, setHfInput] = useState(hfToken);
  const [replicateInput, setReplicateInput] = useState(replicateToken);
  const [activeTab, setActiveTab] = useState<"hf" | "replicate">("hf");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setHfInput(hfToken);
    setReplicateInput(replicateToken);
  }, [hfToken, replicateToken]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveTokens(hfInput.trim(), replicateInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800">
              إعداد مفاتيح الذكاء الاصطناعي
            </h3>
            <p className="text-xs text-slate-500">
              اختر المزود المناسب لتوليد حركة حقيقية للشخصيات
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("hf")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "hf"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Hugging Face (مجاني 100%)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("replicate")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "replicate"
                ? "bg-white text-purple-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Replicate GPU (سريع)</span>
          </button>
        </div>

        {/* Tab 1: Hugging Face (100% Free) */}
        {activeTab === "hf" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 leading-relaxed space-y-2">
              <div className="flex items-center gap-1.5 font-black text-emerald-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>كيف يعمل المفتاح المجاني؟</span>
              </div>
              <p>
                سيرفرات ZeroGPU مجانية تماماً، ولكن للحصول على حصة توليد خاصة بحسابك وتجنب
                رسالة انتهاء الحصة المجهولة، انسخ مفتاحك المجاني في 10 ثوانٍ (بدون أي بطاقة بنكية):
              </p>
              <div className="pt-1">
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-black underline underline-offset-2"
                >
                  <span>اضغط هنا لنسخ التوكن المجاني (huggingface.co/settings/tokens)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Hugging Face Token:</span>
              </label>
              <input
                type="password"
                value={hfInput}
                onChange={(e) => setHfInput(e.target.value)}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 rounded-2xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 text-sm font-mono transition-all"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Replicate */}
        {activeTab === "replicate" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 text-xs text-purple-900 leading-relaxed space-y-2">
              <div className="flex items-center gap-1.5 font-black text-purple-800">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>سيرفرات Replicate فائقة السرعة</span>
              </div>
              <p>
                توليد فوري فائق السرعة عبر كروت Nvidia A100، يتطلب وجود رصيد مشحون بحسابك في Replicate.
              </p>
              <div className="pt-1">
                <a
                  href="https://replicate.com/account/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-black underline underline-offset-2"
                >
                  <span>صفحة المفاتيح: replicate.com/account/api-tokens</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-purple-600" />
                <span>Replicate API Token:</span>
              </label>
              <input
                type="password"
                value={replicateInput}
                onChange={(e) => setReplicateInput(e.target.value)}
                placeholder="r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 text-sm font-mono transition-all"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-6 mt-4 border-t border-slate-100">
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
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white font-black text-xs shadow-md shadow-emerald-200 active:scale-95 transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم الحفظ بنجاح!</span>
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
  );
}
