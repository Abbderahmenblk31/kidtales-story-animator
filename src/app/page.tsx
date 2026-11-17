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
import { Wand2, AlertCircle, Star, Sparkles, Cpu, Film, Key, Zap } from "lucide-react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [engineMode, setEngineMode] = useState<"huggingface" | "replicate" | "ffmpeg">("huggingface");
  const [hfToken, setHfToken] = useState<string>("");
  const [replicateToken, setReplicateToken] = useState<string>("");
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [historyCount, setHistoryCount] = useState<number>(0);

  // Load tokens from localStorage
  useEffect(() => {
    const savedHf = localStorage.getItem("hf_api_token");
    const savedReplicate = localStorage.getItem("replicate_api_token");
    if (savedHf) setHfToken(savedHf);
    if (savedReplicate) setReplicateToken(savedReplicate);
  }, []);

  const handleSaveTokens = (hf: string, replicate: string) => {
    setHfToken(hf);
    setReplicateToken(replicate);
    if (hf) localStorage.setItem("hf_api_token", hf);
    else localStorage.removeItem("hf_api_token");
    if (replicate) localStorage.setItem("replicate_api_token", replicate);
    else localStorage.removeItem("replicate_api_token");
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

    if (engineMode === "replicate" && !replicateToken.trim()) {
      setIsKeyModalOpen(true);
      setSubmitError("يرجى إدخال مفتاح Replicate أولاً أو التبديل لمحرك Hugging Face المجاني.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("prompt", prompt.trim());
      formData.append("engine", engineMode);
      if (replicateToken) formData.append("apiToken", replicateToken.trim());
      if (hfToken) formData.append("hfToken", hfToken.trim());

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          ...(replicateToken ? { "x-replicate-token": replicateToken.trim() } : {}),
          ...(hfToken ? { "x-hf-token": hfToken.trim() } : {}),
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إرسال طلب التحريك.");
      }

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
        hasApiKey={Boolean(hfToken.trim() || replicateToken.trim())}
        historyCount={historyCount}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Intro Hero Section */}
        {!task && (
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black mb-3 border border-purple-200">
              <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
              <span>تحريك قصص الأطفال بالذكاء الاصطناعي الحقيقي • مجاني 100%</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              أيقظ رسومات وقصص الأطفال{" "}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
                واجعل الشخصيات تتحرك حقيقةً!
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
              ارفع رسمة طفلك وشاهد الذكاء الاصطناعي يبث فيها الحركة الفيزيائية الحقيقية
              (تفاعل الشخصيات وحركة الأطراف) مجاناً وبدون بطاقة دفع.
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

            {/* Step 3: Engine Selection Mode */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 block mb-2">
                اختر محرك الذكاء الاصطناعي لتوليد الحركة:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Hugging Face ZeroGPU (Default & 100% Free) */}
                <button
                  type="button"
                  onClick={() => setEngineMode("huggingface")}
                  className={`p-3.5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between ${
                    engineMode === "huggingface"
                      ? "border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-200"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        engineMode === "huggingface"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">
                      مجاني 100%
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-800">
                      Hugging Face ZeroGPU
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      تحريك عصبي حقيقي للأطراف (SVD) مجاناً وبدون بطاقة بنكية.
                    </p>
                  </div>
                </button>

                {/* 2. Replicate GPU (Paid/Credits) */}
                <button
                  type="button"
                  onClick={() => setEngineMode("replicate")}
                  className={`p-3.5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between ${
                    engineMode === "replicate"
                      ? "border-purple-600 bg-purple-50/80 shadow-md ring-2 ring-purple-200"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        engineMode === "replicate"
                          ? "bg-purple-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                      سريع جداً (مدفوع)
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-800">
                      Replicate Cloud GPU
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      توليد فوري فائق السرعة عبر سيرفرات A100 (يتطلب شحن رصيد).
                    </p>
                  </div>
                </button>

                {/* 3. FFmpeg Local Camera */}
                <button
                  type="button"
                  onClick={() => setEngineMode("ffmpeg")}
                  className={`p-3.5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between ${
                    engineMode === "ffmpeg"
                      ? "border-purple-600 bg-purple-50/80 shadow-md ring-2 ring-purple-200"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        engineMode === "ffmpeg"
                          ? "bg-purple-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Film className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                      محلي سريع
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-800">
                      تحريك الكاميرا (FFmpeg)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      تقريب وتبعيد الكاميرا سينمائياً دون تحريك تفاصيل الشخصيات.
                    </p>
                  </div>
                </button>
              </div>

              {engineMode === "huggingface" && (
                <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {hfToken
                        ? "المفتاح المجاني مفعل: سيتم التوليد بأعلى أولوية عبر ZeroGPU."
                        : "وضع ZeroGPU المجاني. يمكنك وضع مفتاح مجاني لزيادة الحصة وتجنب الانتظار."}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(true)}
                    className="font-black underline text-emerald-900 shrink-0 ml-2"
                  >
                    {hfToken ? "تعديل المفتاح" : "إضافة مفتاح مجاني"}
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

            {/* Trigger Button */}
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
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              {task.errorMessage || "لم نتمكن من معالجة المشهد، يرجى المحاولة مرة أخرى."}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="px-5 py-2.5 rounded-xl border border-purple-200 text-purple-700 text-xs font-bold hover:bg-purple-50"
              >
                إعداد مفاتيح الذكاء الاصطناعي
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
          منصة حكايات متحركة للأطفال • دعم كروت الشاشة السحابية المجانية (Hugging Face ZeroGPU)
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
        hfToken={hfToken}
        replicateToken={replicateToken}
        onSaveTokens={handleSaveTokens}
      />
    </div>
  );
}
