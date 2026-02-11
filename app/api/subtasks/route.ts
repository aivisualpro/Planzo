import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import SubTask from "@/lib/models/SubTask";

// GET: Fetch subtasks for a task
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const subtasks = await SubTask.find({ taskId }).sort({ createdDate: 1 }).lean();
    return NextResponse.json({ subtasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a subtask
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    const body = await req.json();

    if (!body.taskId || !body.subTask) {
      return NextResponse.json({ error: "taskId and subTask are required" }, { status: 400 });
    }

    const subtask = await SubTask.create({
      subtaskId: body.subtaskId || `ST-${Date.now()}`,
      taskId: body.taskId,
      subTask: body.subTask,
      status: body.status || "Not Started",
      createdBy: session?.user?.email || "system",
      createdDate: new Date(),
    });

    return NextResponse.json({ subtask });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update a subtask
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.subtaskId) {
      return NextResponse.json({ error: "subtaskId is required" }, { status: 400 });
    }

    const update: any = {};
    if (body.status !== undefined) update.status = body.status;
    if (body.subTask !== undefined) update.subTask = body.subTask;
    if (body.status === "Completed") {
      const session = await getSession();
      update.completedBy = session?.user?.email || "system";
      update.completionDate = new Date();
    }

    const subtask = await SubTask.findOneAndUpdate(
      { subtaskId: body.subtaskId },
      { $set: update },
      { new: true }
    ).lean();

    return NextResponse.json({ subtask });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a subtask
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.subtaskId) {
      return NextResponse.json({ error: "subtaskId is required" }, { status: 400 });
    }

    await SubTask.deleteOne({ subtaskId: body.subtaskId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
