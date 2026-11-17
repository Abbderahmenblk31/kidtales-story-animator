import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processVideoTask, getStatusMessage } from "@/lib/mockQueue";
import { runReplicateVideoAnimation } from "@/lib/replicateEngine";
import { runHuggingFaceVideoAnimation } from "@/lib/huggingFaceEngine";
import { writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "video/mp4",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const prompt = (formData.get("prompt") as string | null)?.trim() || "";
    // Default to 'huggingface' for free AI animation
    const engineMode = (formData.get("engine") as string | null) || "huggingface";

    // Replicate token
    const clientToken =
      req.headers.get("x-replicate-token") ||
      (formData.get("apiToken") as string | null)?.trim();
    const resolvedReplicateToken = clientToken || process.env.REPLICATE_API_TOKEN?.trim();

    // HuggingFace token (optional)
    const clientHfToken =
      req.headers.get("x-hf-token") ||
      (formData.get("hfToken") as string | null)?.trim();
    const resolvedHfToken = clientHfToken || process.env.HF_TOKEN?.trim();

    // 1. Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: "يرجى رفع ملف صورة أو مشهد فيديو للبدء." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "صيغة الملف غير مدعومة. يرجى اختيار ملف PNG أو JPG أو WEBP أو MP4.",
        },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "حجم الملف كبير جداً. الحد الأقصى المسموح به هو 100 ميجابايت.",
        },
        { status: 400 }
      );
    }

    if (!prompt || prompt.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى كتابة وصف التحريك المطلوب (3 أحرف على الأقل).",
        },
        { status: 400 }
      );
    }

    if (engineMode === "replicate" && !resolvedReplicateToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "مفتاح Replicate API Token مطلوب عند اختيار محرك Replicate. يمكنك التبديل إلى محرك Hugging Face المجاني 100%.",
        },
        { status: 400 }
      );
    }

    // 2. Save uploaded file to public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}_${cleanFileName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, uniqueFileName);

    await writeFile(filePath, buffer);
    const originalFileUrl = `/uploads/${uniqueFileName}`;

    // 3. Create VideoTask in SQLite database
    const task = await prisma.videoTask.create({
      data: {
        userPrompt: prompt,
        status: "PENDING",
        progress: 0,
        originalFileUrl,
      },
    });

    // 4. Trigger selected engine
    if (engineMode === "huggingface") {
      // 100% Free ZeroGPU SVD AI Video Generation
      runHuggingFaceVideoAnimation(task.id, resolvedHfToken);
    } else if (engineMode === "replicate" && resolvedReplicateToken) {
      // Replicate GPU
      runReplicateVideoAnimation(task.id, resolvedReplicateToken);
    } else {
      // Local FFmpeg Camera Pan
      processVideoTask(task.id);
    }

    return NextResponse.json(
      {
        success: true,
        task: {
          ...task,
          statusMessage: getStatusMessage(task.status, task.progress),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API generate] Error handling request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ غير متوقع أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.",
      },
      { status: 500 }
    );
  }
}
