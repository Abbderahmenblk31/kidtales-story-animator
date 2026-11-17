"use client";

import React, { useEffect, useState } from "react";
import { X, Clock, Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowRight, Download } from "lucide-react";
import { VideoTaskResponse } from "@/lib/types";

interface RecentGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (task: VideoTaskResponse) => void;
  currentTaskId?: string | null;
}

export function RecentGallery({
  isOpen,
  onClose,
  onSelectTask,
  currentTaskId,
}: RecentGalleryProps) {
  const [tasks, setTasks] = useState<VideoTaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/tasks?limit=15", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.tasks) {
          setTasks(data.tasks);
        }
      } catch (err) {
        console.error("Failed to fetch recent tasks:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-r border-purple-100 animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-5 border-b border-purple-100 flex items-center justify-between bg-purple-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base">قصصي السابقة</h3>
              <p className="text-xs text-slate-500">سجل المشاهد والتحريكات المنفذة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-500" />
              <p className="text-xs font-bold">جاري تحميل سجل القصص...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40 text-purple-400" />
              <p className="text-sm font-bold text-slate-600">لا توجد قصص محفوظة بعد</p>
              <p className="text-xs text-slate-400 mt-1">
                قم بإنشاء أول رسمة متحركة لتظهر في السجل هنا!
              </p>
            </div>
          ) : (
            tasks.map((t) => {
              const isSelected = t.id === currentTaskId;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelectTask(t);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.01] ${
                    isSelected
                      ? "border-purple-500 bg-purple-50 shadow-sm"
                      : "border-slate-100 hover:border-purple-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {t.status === "COMPLETED" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        مكتمل
                      </span>
                    )}
                    {t.status === "PROCESSING" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
                        قيد المعالجة ({t.progress}%)
                      </span>
                    )}
                    {t.status === "FAILED" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        تعذر الإنجاز
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-700 line-clamp-2 mb-2 leading-relaxed">
                    &quot;{t.userPrompt}&quot;
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-bold pt-1.5 border-t border-slate-100">
                    <span className="text-purple-700 flex items-center gap-1">
                      <span>انقر للعرض</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>

                    {t.resultFileUrl && (
                      <a
                        href={`/api/download?taskId=${t.id}`}
                        download={`kidtales-animated-${t.id.slice(-6)}.mp4`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-[11px] font-bold"
                        title="تحميل ملف الفيديو مباشرة"
                      >
                        <Download className="w-3 h-3 text-emerald-600" />
                        <span>تحميل MP4</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
