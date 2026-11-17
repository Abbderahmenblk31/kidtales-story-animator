import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");
    const fileParam = url.searchParams.get("file");

    let relativeFilePath = "";

    if (taskId) {
      const task = await prisma.videoTask.findUnique({
        where: { id: taskId },
      });

      if (!task || !task.resultFileUrl) {
        return new NextResponse("Task or result file not found", { status: 404 });
      }
      relativeFilePath = task.resultFileUrl;
    } else if (fileParam) {
      relativeFilePath = fileParam;
    } else {
      return new NextResponse("Missing taskId or file parameter", { status: 400 });
    }

    // Strip any leading /uploads/ or slashes to get the pure filename
    const basename = path.basename(relativeFilePath);
    const fullPath = path.join(process.cwd(), "public", "uploads", basename);

    if (!fs.existsSync(fullPath)) {
      return new NextResponse("File not found on disk", { status: 404 });
    }

    const stat = fs.statSync(fullPath);
    const ext = path.extname(basename).toLowerCase();
    const contentType = ext === ".mp4" ? "video/mp4" : "application/octet-stream";

    // Clean human-friendly download name
    const downloadFilename = basename.startsWith("animated-")
      ? `kidtales-animated-${basename.replace("animated-", "")}`
      : basename;

    const fileBuffer = fs.readFileSync(fullPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        "Content-Length": stat.size.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err) {
    console.error("[Download API] Error:", err);
    return new NextResponse("Failed to download file", { status: 500 });
  }
}
