import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Task from "@/lib/models/Task";
import SubTask from "@/lib/models/SubTask";
import { logAudit, diffFields } from "@/lib/audit";

// GET: Fetch tasks with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const projectId = searchParams.get("projectId");
    const milestoneId = searchParams.get("milestoneId");
    const status = searchParams.get("status");
    const assignee = searchParams.get("assignee");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const blocked = searchParams.get("blocked");
    const approvalStatus = searchParams.get("approvalStatus");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "createdDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const filter: any = {};
    if (workspaceId && workspaceId !== "all") filter.workspaceId = workspaceId;
    if (projectId && projectId !== "all") filter.projectId = projectId;
    if (milestoneId && milestoneId !== "all") filter.milestoneId = milestoneId;
    if (status && status !== "all") filter.status = status;
    if (assignee && assignee !== "all") filter.assignee = assignee;
    if (priority && priority !== "all") filter.priority = priority;
    if (tag) filter.tags = tag;
    if (blocked === "true") filter.isBlocked = true;
    if (approvalStatus && approvalStatus !== "all") filter.approvalStatus = approvalStatus;
    if (search) {
      filter.$or = [
        { taskName: { $regex: search, $options: "i" } },
        { taskDescription: { $regex: search, $options: "i" } },
        { taskId: { $regex: search, $options: "i" } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [rawTasks, total] = await Promise.all([
      Task.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Task.countDocuments(filter),
    ]);

    // Attach subtask counts to each task
    const taskIds = rawTasks.map((t: any) => t.taskId);
    const subtaskAgg = taskIds.length > 0
      ? await SubTask.aggregate([
          { $match: { taskId: { $in: taskIds } } },
          { $group: {
              _id: "$taskId",
              total: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          }},
        ])
      : [];
    const subtaskMap: Record<string, { total: number; completed: number }> = {};
    subtaskAgg.forEach((s: any) => { subtaskMap[s._id] = { total: s.total, completed: s.completed }; });

    const tasks = rawTasks.map((t: any) => ({
      ...t,
      subtaskCount: subtaskMap[t.taskId]?.total || 0,
      subtaskCompletedCount: subtaskMap[t.taskId]?.completed || 0,
    }));

    return NextResponse.json({ tasks, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new task
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    const taskId = body.taskId || `T-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const task = new Task({
      ...body,
      taskId,
      createdBy: body.createdBy || session.email || session.name,
      createdDate: body.createdDate || new Date(),
      status: body.status || "Not Started",
    });

    await task.save();

    // ── Audit: task_created ──
    logAudit({
      eventType: "task_created",
      description: `Task "${task.taskName || taskId}" was created`,
      performedBy: session.email || session.id,
      performedByName: session.name,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      taskId,
      taskName: task.taskName,
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update a task
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    const { taskId, ...updates } = body;

    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    // Fetch old task for diff
    const oldTask = await Task.findOne({ taskId }).lean() as Record<string, any> | null;

    const task = await Task.findOneAndUpdate(
      { taskId },
      { $set: updates },
      { new: true }
    ).lean() as Record<string, any> | null;

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // ── Audit: task_updated with field diffs ──
    if (oldTask) {
      const trackedFields = ["status", "assignee", "priority", "dueDate", "taskName", "taskDescription", "estimatedHours", "isBlocked", "approvalStatus", "tags"];
      const changes = diffFields(oldTask, updates, trackedFields.filter(f => f in updates));

      for (const change of changes) {
        const eventType = change.field === "status" ? "status_changed"
          : change.field === "assignee" ? "assignment_changed"
          : "task_updated";

        logAudit({
          eventType,
          description: `Task "${task.taskName || taskId}": ${change.field} changed from "${change.oldValue}" to "${change.newValue}"`,
          performedBy: session.email || session.id,
          performedByName: session.name,
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId,
          taskName: task.taskName,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
        });
      }

      // If no tracked fields changed but an update was made, still log it
      if (changes.length === 0) {
        logAudit({
          eventType: "task_updated",
          description: `Task "${task.taskName || taskId}" was updated`,
          performedBy: session.email || session.id,
          performedByName: session.name,
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId,
          taskName: task.taskName,
        });
      }
    }

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
