import { prisma } from "./prisma";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Runs 100% Free AI Video Animation using Hugging Face ZeroGPU (Stable Video Diffusion)
 */
export async function runHuggingFaceVideoAnimation(
  taskId: string,
  userHfToken?: string | null
): Promise<void> {
  (async () => {
    try {
      // 1. Fetch task
      const task = await prisma.videoTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        console.error(`[HFEngine] Task ${taskId} not found`);
        return;
      }

      await prisma.videoTask.update({
        where: { id: taskId },
        data: {
          status: "PROCESSING",
          progress: 15,
        },
      });

      // 2. Resolve input and output paths
      const cleanOriginalPath = task.originalFileUrl.replace(/^\/+/, "");
      const inputAbsolutePath = path.join(process.cwd(), "public", cleanOriginalPath);

      if (!fs.existsSync(inputAbsolutePath)) {
        throw new Error(`الملف الأصلي غير موجود على الخادم: ${cleanOriginalPath}`);
      }

      const outputFileName = `animated-${taskId}.mp4`;
      const outputAbsolutePath = path.join(process.cwd(), "public", "uploads", outputFileName);
      const resultFileUrl = `/uploads/${outputFileName}`;

      const scriptPath = path.join(process.cwd(), "scripts", "generate_hf.py");
      const hfToken = userHfToken?.trim() || process.env.HF_TOKEN?.trim() || "";

      console.log(`[HFEngine] Launching ZeroGPU generation for task ${taskId}...`);

      await new Promise<void>((resolve, reject) => {
        const pythonProcess = spawn("python", [
          scriptPath,
          inputAbsolutePath,
          outputAbsolutePath,
          hfToken,
        ]);

        let lastError = "";

        pythonProcess.stdout.on("data", async (data: Buffer) => {
          const lines = data.toString().split("\n");
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line.trim());
              if (parsed.error) {
                lastError = parsed.error;
              }
              if (parsed.progress) {
                await prisma.videoTask.update({
                  where: { id: taskId },
                  data: { progress: parsed.progress },
                });
              }
            } catch {
              // Non-JSON debug output
            }
          }
        });

        pythonProcess.stderr.on("data", (data: Buffer) => {
          const text = data.toString();
          console.log(`[HFEngine Debug]:`, text);
          if (text.includes("Error") || text.includes("Exception")) {
            lastError = text;
          }
        });

        pythonProcess.on("close", (code) => {
          if (code === 0 && fs.existsSync(outputAbsolutePath)) {
            resolve();
          } else {
            reject(new Error(lastError || `Hugging Face process exited with code ${code}`));
          }
        });

        pythonProcess.on("error", (err) => {
          reject(new Error(`Failed to start python script: ${err.message}`));
        });
      });

      // 3. Mark task as COMPLETED
      console.log(`[HFEngine] Task ${taskId} succeeded: ${resultFileUrl}`);

      await prisma.videoTask.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          progress: 100,
          resultFileUrl,
        },
      });
    } catch (err: unknown) {
      console.error(`[HFEngine] Error processing task ${taskId}:`, err);
      const message =
        err instanceof Error ? err.message : "فشل التوليد عبر Hugging Face، يرجى المحاولة لاحقاً";

      let userFriendlyMessage = message;
      if (typeof message === "string" && message.includes("exceeded your ZeroGPU quota")) {
        userFriendlyMessage =
          "تم استهلاك الحصة المجانية المؤقتة لعنوان IP الحالي على ZeroGPU. يمكنك إنشاء حساب مجاني في 10 ثوانٍ على huggingface.co وجلب مفتاح Access Token مجاني من (huggingface.co/settings/tokens) ووضعه في الإعدادات لتفعيل حصتك المجانية الخاصة فوراً وبدون أي دفع.";
      }

      try {
        await prisma.videoTask.update({
          where: { id: taskId },
          data: {
            status: "FAILED",
            errorMessage: userFriendlyMessage,
          },
        });
      } catch (innerErr) {
        console.error(`[HFEngine] Failed to update task ${taskId} to FAILED:`, innerErr);
      }
    }
  })();
}
