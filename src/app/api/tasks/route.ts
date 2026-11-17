import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStatusMessage } from "@/lib/mockQueue";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

    const tasks = await prisma.videoTask.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const tasksWithMessages = tasks.map((t) => ({
      ...t,
      statusMessage: getStatusMessage(t.status, t.progress),
    }));

    return NextResponse.json({
      success: true,
      tasks: tasksWithMessages,
    });
  } catch (error) {
    console.error("[API tasks] Error fetching tasks list:", error);
    return NextResponse.json(
      { success: false, error: "تعذر استرجاع قائمة المهام." },
      { status: 500 }
    );
  }
}
