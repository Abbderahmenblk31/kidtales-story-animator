"use client";

import React from "react";
import { Sparkles, Wand2, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { VideoTaskResponse } from "@/lib/types";

interface StatusProgressProps {
  task: VideoTaskResponse;
}

export function StatusProgress({ task }: StatusProgressProps) {
  const { status, progress, statusMessage } = task;

  const milestones = [
    { label: "استلام المشهد", min: 0 },
    { label: "تحليل وتجهيز الشخصيات", min: 25 },
    { label: "توليد الحركة بالذكاء الاصطناعي", min: 60 },
    { label: "إخراج وتنسيق القصة", min: 85 },
  ];

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border-3 border-purple-200 shadow-xl relative overflow-hidden transition-all">
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl -z-10" />

      {/* Header with Live Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Wand2 className="w-6 h-6 animate-pulse text-purple-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800">
              جاري نسج سحر الرسوم المتحركة...
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              الخادم يعالج المهمة وينسق حركات الشخصيات بالذكاء الاصطناعي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>تحديث حي كل 3ث</span>
        </div>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="my-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs sm:text-sm font-bold text-purple-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{statusMessage || "جاري المعالجة..."}</span>
          </span>
          <span className="text-lg sm:text-xl font-black text-purple-700">
            {progress}%
          </span>
        </div>

        {/* Outer Bar */}
        <div className="w-full h-5 bg-purple-100 rounded-full overflow-hidden p-1 shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-700 ease-out relative"
            style={{ width: `${Math.max(progress, 5)}%` }}
          >
            {/* Shimmer Light Stripe */}
            <div className="absolute inset-0 bg-white/25 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Milestone Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {milestones.map((ms, index) => {
          const isDone = progress >= ms.min + 20 || status === "COMPLETED";
          const isCurrent =
            progress >= ms.min && (index === 3 || progress < milestones[index + 1]?.min);

          return (
            <div
              key={ms.label}
              className={`p-3 rounded-2xl border text-center transition-all ${
                isDone
                  ? "bg-purple-50/80 border-purple-200 text-purple-900"
                  : isCurrent
                  ? "bg-amber-50 border-amber-300 text-amber-900 shadow-sm"
                  : "bg-slate-50/60 border-slate-100 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-center mb-1.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <span className="text-xs font-bold block leading-tight">{ms.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
