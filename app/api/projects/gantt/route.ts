import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import Milestone from "@/lib/models/Milestone";
import SubTask from "@/lib/models/SubTask";

// GET: Fetch all data needed for the Gantt chart view
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    const filter: any = {};
    if (workspaceId && workspaceId !== "all") filter.workspaceId = workspaceId;

    // Fetch projects
    const projects = await Project.find(filter).sort({ createdDate: -1 }).lean();
    const projectIds = projects.map((p: any) => p.projectId);

    // Fetch all tasks, milestones, subtasks in parallel
    const [tasks, milestones, subtasks] = await Promise.all([
      Task.find({ projectId: { $in: projectIds } })
        .select("taskId taskName projectId milestoneId startDate dueDate status assignee priority progress estimatedHours")
        .sort({ startDate: 1 })
        .lean(),
      Milestone.find({ projectId: { $in: projectIds } })
        .select("milestoneId milestoneName projectId dueDate status progress owner")
        .sort({ dueDate: 1 })
        .lean(),
      SubTask.find({ taskId: { $in: (await Task.find({ projectId: { $in: projectIds } }).select("taskId").lean()).map((t: any) => t.taskId) } })
        .select("subtaskId subTask taskId status createdDate completionDate")
        .lean(),
    ]);

    return NextResponse.json({ projects, tasks, milestones, subtasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
