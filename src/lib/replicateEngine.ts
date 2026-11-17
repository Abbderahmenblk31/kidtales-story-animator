import Replicate from "replicate";
import { prisma } from "./prisma";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

/**
 * Downloads a remote file to a local destination
 */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith("https") ? https : http;

    client
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (!redirectUrl) {
            reject(new Error("Redirect URL missing in response"));
            return;
          }
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download video, status code: ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close(() => resolve());
        });
      })
      .on("error", (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}

/**
 * Converts a local file to a base64 Data URI
 */
function fileToDataUri(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  const mime = mimeTypes[ext] || "image/jpeg";
  return `data:${mime};base64,${fileBuffer.toString("base64")}`;
}

/**
 * Executes True Generative AI Video Animation using Replicate Cloud GPUs (Stable Video Diffusion / AnimateDiff)
 */
export async function runReplicateVideoAnimation(
  taskId: string,
  userApiToken?: string | null
): Promise<void> {
  (async () => {
    try {
      // 1. Check API Token
      const apiToken = userApiToken?.trim() || process.env.REPLICATE_API_TOKEN?.trim();

      if (!apiToken) {
        throw new Error(
          "مفتاح Replicate API Token غير متوفر. يرجى إدخال المفتاح في الإعدادات أو في ملف .env للبدء بالتحريك الحقيقي (يمكنك جلبه مجاناً من replicate.com/account/api-tokens)."
        );
      }

      // 2. Fetch task from database
      const task = await prisma.videoTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        console.error(`[ReplicateEngine] Task ${taskId} not found`);
        return;
      }

      await prisma.videoTask.update({
        where: { id: taskId },
        data: {
          status: "PROCESSING",
          progress: 15,
        },
      });

      // 3. Resolve input image
      const cleanOriginalPath = task.originalFileUrl.replace(/^\/+/, "");
      const inputAbsolutePath = path.join(process.cwd(), "public", cleanOriginalPath);

      if (!fs.existsSync(inputAbsolutePath)) {
        throw new Error(`الملف الأصلي غير موجود: ${cleanOriginalPath}`);
      }

      const inputDataUri = fileToDataUri(inputAbsolutePath);

      // 4. Initialize Replicate client
      const replicate = new Replicate({
        auth: apiToken,
      });

      console.log(`[ReplicateEngine] Sending task ${taskId} to Replicate GPU...`);

      await prisma.videoTask.update({
        where: { id: taskId },
        data: {
          progress: 25,
        },
      });

      // 5. Create Prediction using Stable Video Diffusion (Image-to-Video generative motion)
      // Model version: stability-ai/stable-video-diffusion
      const prediction = await replicate.predictions.create({
        version: "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
        input: {
          input_image: inputDataUri,
          sizing_strategy: "maintain_aspect_ratio",
          video_length: "25_frames_with_svd_xt",
          fps: 7,
          motion_bucket_id: 127,
          cond_aug: 0.02,
        },
      });

      console.log(`[ReplicateEngine] Prediction created: ${prediction.id}`);

      // 6. Poll prediction until completion
      let currentPrediction = prediction;
      let pollCount = 0;

      while (
        currentPrediction.status !== "succeeded" &&
        currentPrediction.status !== "failed" &&
        currentPrediction.status !== "canceled"
      ) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        pollCount++;

        currentPrediction = await replicate.predictions.get(currentPrediction.id);
        console.log(
          `[ReplicateEngine] Poll #${pollCount} for task ${taskId}: status=${currentPrediction.status}`
        );

        // Update progress in database
        let progress = 35;
        if (currentPrediction.status === "processing") {
          progress = Math.min(85, 45 + pollCount * 5);
        }

        try {
          await prisma.videoTask.update({
            where: { id: taskId },
            data: { progress },
          });
        } catch {
          // ignore transient race condition
        }
      }

      if (currentPrediction.status !== "succeeded") {
        const errorDetail = currentPrediction.error || "فشل الذكاء الاصطناعي في توليد الفيديو";
        throw new Error(String(errorDetail));
      }

      // 7. Download resulting video
      const outputUrl = Array.isArray(currentPrediction.output)
        ? currentPrediction.output[0]
        : String(currentPrediction.output);

      if (!outputUrl || !outputUrl.startsWith("http")) {
        throw new Error("لم يتم استلام رابط فيديو صالح من نموذج الذكاء الاصطناعي");
      }

      console.log(`[ReplicateEngine] Downloading generated video from: ${outputUrl}`);

      const outputFileName = `animated-${taskId}.mp4`;
      const outputAbsolutePath = path.join(process.cwd(), "public", "uploads", outputFileName);
      const resultFileUrl = `/uploads/${outputFileName}`;

      await downloadFile(outputUrl, outputAbsolutePath);

      // Verify downloaded file size
      if (!fs.existsSync(outputAbsolutePath) || fs.statSync(outputAbsolutePath).size === 0) {
        throw new Error("فشل تحميل الفيديو المنشأ من السيرفر السحابي");
      }

      console.log(`[ReplicateEngine] Task ${taskId} completed! Saved to: ${resultFileUrl}`);

      // 8. Update DB to COMPLETED
      await prisma.videoTask.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          progress: 100,
          resultFileUrl,
        },
      });
    } catch (err: unknown) {
      console.error(`[ReplicateEngine] Error processing task ${taskId}:`, err);
      const message = err instanceof Error ? err.message : "فشلت المعالجة بالذكاء الاصطناعي";
      try {
        await prisma.videoTask.update({
          where: { id: taskId },
          data: {
            status: "FAILED",
            errorMessage: message,
          },
        });
      } catch (innerErr) {
        console.error(`[ReplicateEngine] Failed to mark task ${taskId} as FAILED:`, innerErr);
      }
    }
  })();
}
