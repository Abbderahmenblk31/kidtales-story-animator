"use client";

import React from "react";
import { Sparkles, MessageSquareHeart, Lightbulb } from "lucide-react";
import { PromptSpark } from "@/lib/types";

interface PromptInputProps {
  prompt: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const PROMPT_SPARKS: PromptSpark[] = [
  {
    id: "cat-boy",
    emoji: "🐱",
    label: "القطة تقفز والولد يبتسم",
    prompt: "القطة اللطيفة تقفز بمرح بينما يبتسم الصبي الصغير ويلوح بيده بسعادة",
  },
  {
    id: "butterflies",
    emoji: "🦋",
    label: "فراشات ملونة ترفرف",
    prompt: "مجموعة من الفراشات الملونة ترفرف برقة حول الأزهار مع نسيم لطيف",
  },
  {
    id: "magic-stars",
    emoji: "✨",
    label: "غبار سحري ونجوم براقة",
    prompt: "تساقط غبار سحري متلألئ مع وميض نجوم براقة تضيء المشهد ببهجة",
  },
  {
    id: "bunny-hop",
    emoji: "🐰",
    label: "الأرنب يقفز في المرج",
    prompt: "الأرنب الظريف يحرك أذنيه ويقفز بخفة عبر العشب الأخضر المتماوج",
  },
  {
    id: "rainbow-clouds",
    emoji: "🌈",
    label: "قوس قزح وغيوم متحركة",
    prompt: "ظهور قوس قزح مشرق في السماء بينما تتحرك الغيوم القطنية بنعومة",
  },
];

export function PromptInput({ prompt, onChange, disabled = false }: PromptInputProps) {
  const maxChars = 500;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="animation-prompt"
          className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2"
        >
          <span className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-black">
            2
          </span>
          <span>صِف الحركة السحرية للشخصيات والمشهد</span>
        </label>
        <span
          className={`text-xs font-semibold ${
            prompt.length > maxChars * 0.9 ? "text-amber-600 font-bold" : "text-slate-400"
          }`}
        >
          {prompt.length} / {maxChars} حرف
        </span>
      </div>

      <div className="relative">
        <textarea
          id="animation-prompt"
          value={prompt}
          onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
          placeholder="اكتب هنا ما تريده أن يحدث في القصة... مثلاً: (الولد الصغير يلوح بيده بحماس بينما تقفز القطة الرمادية وتتساقط نجوم ملونة في الخلفية)"
          rows={4}
          disabled={disabled}
          className="w-full px-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-white text-slate-800 placeholder:text-slate-400 text-sm sm:text-base transition-all resize-none shadow-sm disabled:bg-slate-50 disabled:opacity-70 leading-relaxed"
        />
        <div className="absolute bottom-3 left-3 text-purple-400 pointer-events-none">
          <MessageSquareHeart className="w-5 h-5 opacity-40" />
        </div>
      </div>

      {/* Preset Chips */}
      <div className="mt-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>أفكار واقتراحات سريعة لقصتك (انقر للتطبيق):</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PROMPT_SPARKS.map((spark) => (
            <button
              key={spark.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(spark.prompt)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/80 text-xs font-medium transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none shadow-2xs"
            >
              <span className="text-sm">{spark.emoji}</span>
              <span>{spark.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
