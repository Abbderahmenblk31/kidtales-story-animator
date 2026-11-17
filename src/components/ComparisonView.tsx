"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Download,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Play,
  Pause,
  Repeat,
  Share2,
  Copy,
  Eye,
  Columns,
} from "lucide-react";
import confetti from "canvas-confetti";
import { VideoTaskResponse } from "@/lib/types";

interface ComparisonViewProps {
  task: VideoTaskResponse;
  onReset: () => void;
}

export function ComparisonView({ task, onReset }: ComparisonViewProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "toggle">("side-by-side");
  const [toggleActive, setToggleActive] = useState<"original" | "animated">("animated");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Trigger cheerful confetti explosion upon completion!
  useEffect(() => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"],
      });
    } catch {
      // Confetti fallback safely handled
    }
  }, []);

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleCopyPrompt = () => {
    if (task.userPrompt) {
      navigator.clipboard.writeText(task.userPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isOriginalVideo = task.originalFileUrl.endsWith(".mp4");

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border-3 border-purple-200 shadow-2xl relative overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-500">
      {/* Top Celebration Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                قصتك تنبض بالحياة الآن!
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                اكتمل الإخراج
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              قارن المشهد الثابت الأصلي بالرسوم المتحركة المولدة بالذكاء الاصطناعي
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-center bg-purple-50 p-1 rounded-2xl border border-purple-200">
          <button
            type="button"
            onClick={() => setViewMode("side-by-side")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "side-by-side"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-purple-500 hover:text-purple-700"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>جنباً إلى جنب</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("toggle")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "toggle"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-purple-500 hover:text-purple-700"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>تبديل الرؤية</span>
          </button>
        </div>
      </div>

      {/* Prompt summary pill */}
      <div className="my-4 p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-slate-700 truncate max-w-[80%]">
          <span className="font-black text-purple-700 shrink-0">وصف السحر:</span>
          <span className="italic truncate">&quot;{task.userPrompt}&quot;</span>
        </div>
        <button
          type="button"
          onClick={handleCopyPrompt}
          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-bold shrink-0 ml-2"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>{copied ? "تم النسخ!" : "نسخ الوصف"}</span>
        </button>
      </div>

      {/* Comparison Display Area */}
      {viewMode === "side-by-side" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
          {/* 1. Original Scene */}
          <div className="rounded-3xl border-3 border-purple-200 overflow-hidden bg-slate-900 shadow-md flex flex-col">
            <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between text-white text-xs font-bold">
              <span className="flex items-center gap-1.5 text-amber-300">
                <span>🎨 المشهد الأصلي (قبل التحريك)</span>
              </span>
              <span className="text-slate-400">ملف الإدخال</span>
            </div>

            <div className="relative aspect-video flex items-center justify-center bg-black/60">
              {isOriginalVideo ? (
                <video
                  src={task.originalFileUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={task.originalFileUrl}
                  alt="المشهد الأصلي"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>

          {/* 2. Animated Result */}
          <div className="rounded-3xl border-3 border-purple-400 overflow-hidden bg-slate-900 shadow-xl flex flex-col relative ring-4 ring-purple-100">
            <div className="bg-gradient-to-r from-purple-700 to-pink-600 px-4 py-2.5 flex items-center justify-between text-white text-xs font-bold">
              <span className="flex items-center gap-1.5 text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>الفيلم المتحرك (النتيجة السحرية)</span>
              </span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                AI Rendered
              </span>
            </div>

            <div className="relative aspect-video flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={task.resultFileUrl || "/samples/animated-storybook-result.mp4"}
                autoPlay
                muted
                playsInline
                loop={isLooping}
                controls
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Toggle View Mode */
        <div className="my-6 max-w-2xl mx-auto">
          <div className="flex justify-center mb-3 gap-2">
            <button
              onClick={() => setToggleActive("original")}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                toggleActive === "original"
                  ? "bg-slate-800 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              المشهد الأصلي
            </button>
            <button
              onClick={() => setToggleActive("animated")}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                toggleActive === "animated"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              }`}
            >
              الفيلم المتحرك بالذكاء الاصطناعي ✨
            </button>
          </div>

          <div className="rounded-3xl border-3 border-purple-300 overflow-hidden bg-slate-900 shadow-xl aspect-video flex items-center justify-center">
            {toggleActive === "original" ? (
              isOriginalVideo ? (
                <video
                  src={task.originalFileUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={task.originalFileUrl}
                  alt="المشهد الأصلي"
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <video
                ref={videoRef}
                src={task.resultFileUrl || "/samples/animated-storybook-result.mp4"}
                autoPlay
                muted
                playsInline
                loop={isLooping}
                controls
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      )}

      {/* Control Actions Bottom Bar */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-purple-100">
        <div className="flex items-center gap-2">
          {task.resultFileUrl && (
            <a
              href={task.resultFileUrl}
              download="animated-story-video.mp4"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-200 hover:brightness-105 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تحميل الفيديو (MP4)</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all ${
              isLooping
                ? "bg-purple-100 border-purple-300 text-purple-800"
                : "bg-slate-100 border-slate-200 text-slate-600"
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>التكرار التلقائي: {isLooping ? "مفعل" : "معطل"}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>تحريك قصة جديدة ✨</span>
        </button>
      </div>
    </div>
  );
}
