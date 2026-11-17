import { prisma } from "./prisma";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Returns dynamic, friendly status messages for children and educators
 */
export function getStatusMessage(status: string, progress: number): string {
  if (status === "PENDING") {
    return "✨ جاري قراءة المشهد وتجهيز زوايا الحركة السينمائية...";
  }
  if (status === "PROCESSING") {
    if (progress < 30) {
      return "🎨 تحليل طبقات الصورة وتنسيق أبعاد الكاميرا بدقة 1080p...";
    }
    if (progress < 70) {
      return "🪄 تطبيق حركة الكاميرا التفاعلية 2.5D و Dynamic Ken Burns...";
    }
    return "🎬 وضع اللمسات النهائية وتصدير الفيديو الكرتوني عالي الدقة...";
  }
  if (status === "COMPLETED") {
    return "🎉 اكتملت المعالجة بنجاح! قصتك الآن تنبض بالحياة كفيلم كرتوني متحرك!";
  }
  return "حدث خطأ أثناء معالجة الفيديو، يرجى المحاولة مرة أخرى.";
}

/**
 * Resolves the FFmpeg executable path reliably across Windows and other environments
 */
function resolveFfmpegPath(): string {
  // 1. Direct check to installed @ffmpeg-installer binary on Windows
  const installerPath = path.join(
    process.cwd(),
    "node_modules",
    "@ffmpeg-installer",
    "win32-x64",
    "ffmpeg.exe"
  );
  if (fs.existsSync(installerPath)) {
    return installerPath;
  }

  // 2. Check local project bin
  const localCandidate = path.join(process.cwd(), "bin", "ffmpeg.exe");
  if (fs.existsSync(localCandidate)) {
    return localCandidate;
  }

  // 3. Fallback to system PATH
  return "ffmpeg";
}

/**
 * Real Video Processing Engine using FFmpeg:
 * 1. Reads the real uploaded image associated with taskId from Prisma SQLite.
 * 2. Applies dynamic 2.5D Camera movement & Ken Burns Pan & Zoom at 1080p (1920x1080).
 * 3. Exports an MP4 video to public/uploads/animated-[taskId].mp4.
 * 4. Updates VideoTask in Prisma with COMPLETED, 100% progress, and the result URL.
 */
export async function processVideoTask(taskId: string): Promise<void> {
  // Fire-and-forget background processing
  (async () => {
    try {
      // 1. Retrieve the task from database
      const task = await prisma.videoTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        console.error(`[VideoEngine] Task not found: ${taskId}`);
        return;
      }

      // 2. Initial state: PROCESSING, 15%
      await prisma.videoTask.update({
        where: { id: taskId },
        data: {
          status: "PROCESSING",
          progress: 15,
        },
      });

      // 3. Resolve input and output file paths
      const cleanOriginalPath = task.originalFileUrl.replace(/^\/+/, "");
      const inputAbsolutePath = path.join(process.cwd(), "public", cleanOriginalPath);

      if (!fs.existsSync(inputAbsolutePath)) {
        throw new Error(`الملف الأصلي غير موجود على الخادم: ${cleanOriginalPath}`);
      }

      const outputFileName = `animated-${taskId}.mp4`;
      const outputAbsolutePath = path.join(process.cwd(), "public", "uploads", outputFileName);
      const resultFileUrl = `/uploads/${outputFileName}`;

      const ext = path.extname(cleanOriginalPath).toLowerCase();
      const isVideo = ext === ".mp4" || ext === ".webm";

      const ffmpegPath = resolveFfmpegPath();
      console.log(`[VideoEngine] Processing task ${taskId} with FFmpeg (${ffmpegPath})`);
      console.log(`[VideoEngine] Input: ${inputAbsolutePath}`);
      console.log(`[VideoEngine] Output: ${outputAbsolutePath}`);

      // 4. Build FFmpeg command arguments
      let args: string[] = [];

      if (!isVideo) {
        // Image input: Apply Dynamic 2.5D Ken Burns Pan & Zoom filter at 1080p (1920x1080)
        // 1. scale to high-res canvas (2560x1440) maintaining aspect ratio
        // 2. crop to 16:9 canvas
        // 3. zoompan with sinusoidal horizontal and vertical floating pan
        // 4. format to yuv420p for HTML5 browser compatibility
        const videoFilter =
          "scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440," +
          "zoompan=z='min(zoom+0.0012,1.22)':x='iw/2-(iw/zoom/2)+sin(on/25)*35':y='ih/2-(ih/zoom/2)+sin(on/35)*20':d=150:s=1920x1080:fps=30," +
          "format=yuv420p";

        args = [
          "-y",
          "-loop",
          "1",
          "-i",
          inputAbsolutePath,
          "-vf",
          videoFilter,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-t",
          "5",
          outputAbsolutePath,
        ];
      } else {
        // Video input: Standardize to 1080p 16:9 with smooth scale & crop
        args = [
          "-y",
          "-i",
          inputAbsolutePath,
          "-vf",
          "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=yuv420p",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-t",
          "10",
          outputAbsolutePath,
        ];
      }

      // Update progress to 35% before starting render
      await prisma.videoTask.update({
        where: { id: taskId },
        data: { progress: 35 },
      });

      // 5. Execute FFmpeg process
      await new Promise<void>((resolve, reject) => {
        const child = spawn(ffmpegPath, args);

        child.stderr.on("data", async (data: Buffer) => {
          const str = data.toString();
          // Match frame= 75 in ffmpeg output to update progress dynamically
          const match = str.match(/frame=\s*(\d+)/);
          if (match && match[1]) {
            const currentFrame = parseInt(match[1], 10);
            // 150 total frames for 5 seconds at 30fps
            const calculatedProgress = Math.min(
              85,
              Math.max(35, Math.round(35 + (currentFrame / 150) * 50))
            );

            try {
              await prisma.videoTask.update({
                where: { id: taskId },
                data: { progress: calculatedProgress },
              });
            } catch {
              // Ignore transient update race condition
            }
          }
        });

        child.on("error", (err) => {
          reject(new Error(`فشل تشغيل محرك FFmpeg: ${err.message}`));
        });

        child.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`FFmpeg exited with non-zero code ${code}`));
          }
        });
      });

      // 6. Verify generated file
      if (!fs.existsSync(outputAbsolutePath) || fs.statSync(outputAbsolutePath).size === 0) {
        throw new Error("فشل إنشاء ملف الفيديو أو أن حجم الملف فارغ.");
      }

      console.log(`[VideoEngine] Task ${taskId} finished successfully: ${resultFileUrl}`);

      // 7. Update database to COMPLETED (100%)
      await prisma.videoTask.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          progress: 100,
          resultFileUrl: resultFileUrl,
        },
      });
    } catch (err: unknown) {
      console.error(`[VideoEngine] Error processing task ${taskId}:`, err);
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء معالجة الفيديو";
      try {
        await prisma.videoTask.update({
          where: { id: taskId },
          data: {
            status: "FAILED",
            errorMessage: message,
          },
        });
      } catch (innerErr) {
        console.error(`[VideoEngine] Failed to mark task ${taskId} as FAILED:`, innerErr);
      }
    }
  })();
}

// Backward compatibility alias so existing imports keep working
export const simulateAiProcessing = processVideoTask;
