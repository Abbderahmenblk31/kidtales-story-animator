"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, Image as ImageIcon, Video, Trash2, Wand2, CheckCircle2 } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  disabled?: boolean;
}

export function UploadZone({
  onFileSelect,
  selectedFile,
  onClearFile,
  disabled = false,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle preview generation when selectedFile changes
  React.useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const validateAndProcessFile = (file: File) => {
    setFileError(null);

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "video/mp4",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFileError("الصيغة غير مدعومة! يرجى اختيار صورة (PNG, JPG, WEBP) أو فيديو (MP4).");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setFileError("حجم الملف كبير جداً! الحد الأقصى هو 100 ميجابايت.");
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  // Quick action: load the curated sample story scene
  const handleLoadSample = async () => {
    if (disabled) return;
    try {
      const response = await fetch("/samples/sample-storybook-scene.jpg");
      const blob = await response.blob();
      const sampleFile = new File([blob], "sample-storybook-scene.jpg", {
        type: "image/jpeg",
      });
      validateAndProcessFile(sampleFile);
    } catch (err) {
      console.error("Failed to load sample image:", err);
      setFileError("تعذر تحميل المشهد التجريبي.");
    }
  };

  const isVideo = selectedFile?.type.startsWith("video/");

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">
            1
          </span>
          <span>ارفع رسمة أو مشهد القصة الثابتة</span>
        </label>

        {!selectedFile && !disabled && (
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-full transition-all active:scale-95"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-600" />
            <span>تجربة رسمة جاهزة</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,video/mp4"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Selected File Preview Box */}
      {selectedFile && previewUrl ? (
        <div className="relative group rounded-3xl overflow-hidden border-3 border-purple-300 bg-purple-50/50 p-4 transition-all shadow-md">
          <div className="relative aspect-video max-h-72 w-full mx-auto rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
            {isVideo ? (
              <video
                src={previewUrl}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="معاينة الرسمة"
                className="w-full h-full object-contain"
              />
            )}

            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-purple-700 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>جاهز للتحريك</span>
            </div>
          </div>

          {/* File Meta & Actions */}
          <div className="mt-3 flex items-center justify-between text-xs sm:text-sm text-slate-700">
            <div className="flex items-center gap-2 truncate max-w-[70%]">
              {isVideo ? (
                <Video className="w-4 h-4 text-purple-600 shrink-0" />
              ) : (
                <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />
              )}
              <span className="font-semibold truncate">{selectedFile.name}</span>
              <span className="text-slate-400">
                ({(selectedFile.size / (1024 * 1024)).toFixed(2)} ميجابايت)
              </span>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={onClearFile}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold px-3 py-1.5 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>إزالة وتغيير</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Empty Drag & Drop Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative border-3 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-purple-500 bg-purple-100/70 scale-[1.01] shadow-lg"
              : "border-purple-200 bg-gradient-to-b from-purple-50/60 to-white hover:border-purple-400 hover:bg-purple-50/80"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-400 flex items-center justify-center text-white shadow-md shadow-purple-200 transform group-hover:scale-110 transition-transform">
            <UploadCloud className="w-9 h-9 animate-bounce" />
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-800 mb-1">
            اسحب وأفلت رسمتك هنا، أو انقر للاختيار
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-3">
            يدعم صور ورسومات الأطفال (PNG, JPG, WEBP) أو مشاهد الفيديو القصيرة (MP4) حتى 100 ميجابايت.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-purple-200 text-purple-700 font-bold text-xs shadow-sm">
            <ImageIcon className="w-4 h-4" />
            <span>اختر ملف من جهازك</span>
          </div>
        </div>
      )}

      {fileError && (
        <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <span>⚠️ {fileError}</span>
        </div>
      )}
    </div>
  );
}
