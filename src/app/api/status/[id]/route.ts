import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStatusMessage } from "@/lib/mockQueue";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المهمة مطلوب." },
        { status: 400 }
      );
    }

    const task = await prisma.videoTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "المهمة غير موجودة." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task: {
        ...task,
        statusMessage: getStatusMessage(task.status, task.progress),
      },
    });
  } catch (error) {
    console.error(`[API status] Error fetching task ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: "فشل استرجاع حالة المهمة." },
      { status: 500 }
    );
  }
}
