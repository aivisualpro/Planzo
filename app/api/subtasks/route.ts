import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import SubTask from "@/lib/models/SubTask";
import { logAudit } from "@/lib/audit";

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

    // ── Audit ──
    logAudit({
      eventType: "task_updated",
      description: `Subtask "${body.subTask}" added to task ${body.taskId}`,
      performedBy: session?.email || session?.id || "system",
      performedByName: session?.name,
      taskId: body.taskId,
      field: "subtasks",
      newValue: body.subTask,
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
    const session = await getSession();

    if (!body.subtaskId) {
      return NextResponse.json({ error: "subtaskId is required" }, { status: 400 });
    }

    const oldSubtask = await SubTask.findOne({ subtaskId: body.subtaskId }).lean() as any;

    const update: any = {};
    if (body.status !== undefined) update.status = body.status;
    if (body.subTask !== undefined) update.subTask = body.subTask;
    if (body.status === "Completed") {
      update.completedBy = session?.user?.email || "system";
      update.completionDate = new Date();
    }

    const subtask = await SubTask.findOneAndUpdate(
      { subtaskId: body.subtaskId },
      { $set: update },
      { new: true }
    ).lean() as any;

    // ── Audit ──
    if (oldSubtask && subtask && body.status && oldSubtask.status !== body.status) {
      logAudit({
        eventType: "task_updated",
        description: `Subtask "${subtask.subTask}" status changed from "${oldSubtask.status}" to "${body.status}"`,
        performedBy: session?.email || session?.id || "system",
        performedByName: session?.name,
        taskId: subtask.taskId,
        field: "subtask_status",
        oldValue: oldSubtask.status,
        newValue: body.status,
      });
    }

    return NextResponse.json({ subtask });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a subtask
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    const body = await req.json();

    if (!body.subtaskId) {
      return NextResponse.json({ error: "subtaskId is required" }, { status: 400 });
    }

    const subtask = await SubTask.findOne({ subtaskId: body.subtaskId }).lean() as any;

    await SubTask.deleteOne({ subtaskId: body.subtaskId });

    // ── Audit ──
    if (subtask) {
      logAudit({
        eventType: "task_updated",
        description: `Subtask "${subtask.subTask}" was deleted from task ${subtask.taskId}`,
        performedBy: session?.email || session?.id || "system",
        performedByName: session?.name,
        taskId: subtask.taskId,
        field: "subtasks",
        oldValue: subtask.subTask,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
