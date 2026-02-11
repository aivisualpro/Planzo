import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import Milestone from "@/lib/models/Milestone";

// GET: Fetch projects or a single project dashboard
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const workspaceId = searchParams.get("workspaceId");

    // Single project dashboard
    if (projectId) {
      const project = await Project.findOne({ projectId }).lean();
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      const now = new Date();

      const [
        tasks,
        tasksByStatus,
        overdueTasks,
        blockedTasks,
        milestones,
        completedTasks,
        totalTasks,
      ] = await Promise.all([
        Task.find({ projectId }).sort({ dueDate: 1 }).lean(),
        Task.aggregate([
          { $match: { projectId } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Task.countDocuments({
          projectId,
          status: { $nin: ["Completed", "completed"] },
          dueDate: { $lt: now, $ne: null },
        }),
        Task.find({
          projectId,
          isBlocked: true,
          status: { $nin: ["Completed", "completed"] },
        }).lean(),
        Milestone.find({ projectId }).sort({ dueDate: 1 }).lean(),
        Task.countDocuments({ projectId, status: { $in: ["Completed", "completed"] } }),
        Task.countDocuments({ projectId }),
      ]);

      // Overdue severity
      const overdueSeverity = await Task.aggregate([
        {
          $match: {
            projectId,
            status: { $nin: ["Completed", "completed"] },
            dueDate: { $lt: now, $ne: null },
          },
        },
        {
          $project: {
            daysOverdue: { $divide: [{ $subtract: [now, "$dueDate"] }, 86400000] },
            taskId: 1, taskName: 1, assignee: 1, dueDate: 1, priority: 1,
          },
        },
        { $sort: { daysOverdue: -1 } },
      ]);

      const statusMap: Record<string, number> = {};
      tasksByStatus.forEach((s: any) => { statusMap[s._id || "Unknown"] = s.count; });

      const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Effort-weighted completion
      const effortData = await Task.aggregate([
        { $match: { projectId, estimatedHours: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            totalEstimated: { $sum: "$estimatedHours" },
            completedEstimated: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["Completed", "completed"]] },
                  "$estimatedHours",
                  0,
                ],
              },
            },
          },
        },
      ]);
      const effortPct = effortData[0]?.totalEstimated > 0
        ? Math.round((effortData[0].completedEstimated / effortData[0].totalEstimated) * 100) : null;

      return NextResponse.json({
        project,
        tasks,
        milestones,
        metrics: {
          totalTasks,
          completedTasks,
          taskCompletionPct,
          effortCompletionPct: effortPct,
          overdueTasks,
          blockedTasks: blockedTasks.length,
          statusBreakdown: statusMap,
          overdueSeverity,
          blockedTasksList: blockedTasks,
        },
      });
    }

    // List all projects
    const filter: any = {};
    if (workspaceId && workspaceId !== "all") filter.workspaceId = workspaceId;

    const projects = await Project.find(filter).sort({ createdDate: -1 }).lean();

    // Attach task counts to each project
    const projectIds = projects.map((p: any) => p.projectId);
    const taskCounts = await Task.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $group: {
          _id: "$projectId",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $in: ["$status", ["Completed", "completed"]] }, 1, 0] },
          },
        },
      },
    ]);

    const countMap: Record<string, any> = {};
    taskCounts.forEach((c: any) => { countMap[c._id] = c; });

    const enriched = projects.map((p: any) => ({
      ...p,
      taskCount: countMap[p.projectId]?.total || 0,
      completedCount: countMap[p.projectId]?.completed || 0,
    }));

    return NextResponse.json({ projects: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
