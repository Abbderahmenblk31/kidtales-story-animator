"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { PromptInput } from "@/components/PromptInput";
import { StatusProgress } from "@/components/StatusProgress";
import { ComparisonView } from "@/components/ComparisonView";
import { RecentGallery } from "@/components/RecentGallery";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { useTaskPolling } from "@/hooks/useTaskPolling";
import { VideoTaskResponse } from "@/lib/types";
import { Wand2, AlertCircle, Star, Sparkles, Cpu, Film, Key } from "lucide-react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [engineMode, setEngineMode] = useState<"replicate" | "ffmpeg">("replicate");
  const [apiToken, setApiToken] = useState<string>("");
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [historyCount, setHistoryCount] = useState<number>(0);

  // Load API token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("replicate_api_token");
    if (savedToken) {
      setApiToken(savedToken);
    }
  }, []);

  const handleSaveToken = (token: string) => {
    setApiToken(token);
    if (token) {
      localStorage.setItem("replicate_api_token", token);
    } else {
      localStorage.removeItem("replicate_api_token");
    }
  };

  // Hook for 3-second real-time polling
  const { task, isPolling, startPolling, reset, setTask } = useTaskPolling({
    pollingIntervalMs: 3000,
    onCompleted: () => {
      refreshCount();
    },
  });

  const refreshCount = async () => {
    try {
      const res = await fetch("/api/tasks?limit=1");
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        setHistoryCount(data.tasks.length > 0 ? 1 : 0);
      }
    } catch {
      // Silent error fallback
    }
  };

  useEffect(() => {
    refreshCount();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedFile) {
      setSubmitError("يرجى اختيار أو رفع صورة أو مشهد للبدء.");
      return;
    }

    if (!prompt.trim() || prompt.trim().length < 3) {
      setSubmitError("يرجى كتابة وصف التحريك المطلوب (3 أحرف على الأقل).");
      return;
    }

    if (engineMode === "replicate" && !apiToken.trim()) {
      setIsKeyModalOpen(true);
      setSubmitError("يرجى إدخال مفتاح Replicate API أولاً للبدء بالتحريك الحقيقي بالذكاء الاصطناعي.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("prompt", prompt.trim());
      formData.append("engine", engineMode);
      if (apiToken) {
        formData.append("apiToken", apiToken.trim());
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          ...(apiToken ? { "x-replicate-token": apiToken.trim() } : {}),
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إرسال طلب التحريك.");
      }

      // Start 3-second polling on the newly created task
      startPolling(data.task.id, data.task);
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setSelectedFile(null);
    setPrompt("");
    setSubmitError(null);
  };

  const handleSelectFromGallery = (pastTask: VideoTaskResponse) => {
    setTask(pastTask);
    if (pastTask.status === "PENDING" || pastTask.status === "PROCESSING") {
      startPolling(pastTask.id, pastTask);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header
        onToggleGallery={() => setIsGalleryOpen(true)}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        hasApiKey={Boolean(apiToken.trim())}
        historyCount={historyCount}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Intro Hero Section (visible when not viewing result) */}
        {!task && (
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black mb-3 border border-purple-200">
              <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
              <span>مختبر تحريك قصص الأطفال بالذكاء الاصطناعي الحقيقي</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              أيقظ رسومات الأطفال{" "}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
                واجعل الشخصيات تتحرك حقيقةً!
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
              ارفع رسمة طفلك، اكتب كيف تريده أن يقفز أو يلوح بيده، وشاهد الذكاء الاصطناعي التوليدي
              يبث فيه الحركة الحقيقية عبر كروت الشاشة السحابية.
            </p>
          </div>
        )}

        {/* State 1: Creation Form */}
        {!task && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-purple-200 shadow-xl space-y-6"
          >
            {/* Step 1: Upload Zone */}
            <UploadZone
              selectedFile={selectedFile}
              onFileSelect={(file) => {
                setSelectedFile(file);
                setSubmitError(null);
              }}
              onClearFile={() => setSelectedFile(null)}
              disabled={isSubmitting}
            />

            {/* Step 2: Prompt Builder */}
            <PromptInput
              prompt={prompt}
              onChange={(val) => {
                setPrompt(val);
                setSubmitError(null);
              }}
              disabled={isSubmitting}
            />

            {/* Engine Selection Mode */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 block mb-2">
                اختر محرك التحريك المطلوب:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEngineMode("replicate")}
                  className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 ${
                    engineMode === "replicate"
                      ? "border-purple-600 bg-purple-50/80 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      engineMode === "replicate"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-black text-xs text-slate-800">
                      <span>تحريك حقيقي بالذكاء الاصطناعي</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-800 font-bold">
                        GPU Cloud
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      تحريك الأطراف والشخصيات حقيقةً عبر نماذج Diffusion (يتطلب API Key مجاني).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEngineMode("ffmpeg")}
                  className={`p-3.5 rounded-2xl border-2 text-right transition-all flex items-start gap-3 ${
                    engineMode === "ffmpeg"
                      ? "border-purple-600 bg-purple-50/80 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      engineMode === "ffmpeg"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-black text-xs text-slate-800">
                      <span>تحريك كاميرا سينمائي سريع</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        محلي ومجاني
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      تقريب وتبعيد الكاميرا 2.5D (Ken Burns) دون تحريك أطراف الشخصيات.
                    </p>
                  </div>
                </button>
              </div>

              {engineMode === "replicate" && !apiToken && (
                <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>يجب إدخال مفتاح Replicate لتشغيل كروت الشاشة السحابية.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(true)}
                    className="font-black underline text-amber-900 shrink-0"
                  >
                    إدخال المفتاح الآن
                  </button>
                </div>
              )}
            </div>

            {/* Error Notification */}
            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Step 3: Trigger Generation Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !selectedFile || prompt.trim().length < 3}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-black text-base sm:text-lg shadow-xl shadow-purple-200 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري إرسال القصة إلى المختبر السحري...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6 animate-pulse" />
                    <span>أنشئ الرسوم المتحركة الآن! ✨</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* State 2: Processing in progress */}
        {task && task.status !== "COMPLETED" && task.status !== "FAILED" && (
          <div className="space-y-6">
            <StatusProgress task={task} />
          </div>
        )}

        {/* State 3: Completed */}
        {task && task.status === "COMPLETED" && (
          <ComparisonView task={task} onReset={handleReset} />
        )}

        {/* State 4: Failed */}
        {task && task.status === "FAILED" && (
          <div className="bg-white rounded-3xl p-8 border-3 border-rose-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800">
              عذراً، حدث خطأ أثناء المعالجة
            </h3>
            <p className="text-sm text-slate-500">
              {task.errorMessage || "لم نتمكن من معالجة المشهد، يرجى المحاولة مرة أخرى."}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="px-5 py-2.5 rounded-xl border border-purple-200 text-purple-700 text-xs font-bold hover:bg-purple-50"
              >
                فحص مفتاح الـ API
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-all"
              >
                المحاولة من جديد
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-purple-100 mt-12 bg-white/50">
        <p>
          منصة حكايات متحركة للأطفال • دعم كروت الشاشة السحابية (Replicate) والتحريك المحلي
        </p>
      </footer>

      {/* History Drawer */}
      <RecentGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectTask={handleSelectFromGallery}
        currentTaskId={task?.id}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        apiKey={apiToken}
        onSaveKey={handleSaveToken}
      />
    </div>
  );
}
