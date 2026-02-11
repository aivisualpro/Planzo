import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Task from "@/lib/models/Task";
import Project from "@/lib/models/Project";
import Milestone from "@/lib/models/Milestone";
import Employee from "@/lib/models/Employee";
import ActivityLog from "@/lib/models/ActivityLog";
import TimeLog from "@/lib/models/TimeLog";

// GET: Aggregate dashboard metrics
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    const filter: any = {};
    if (workspaceId) filter.workspaceId = workspaceId;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // ── Parallel aggregation queries ──────────────────────────────
    const [
      totalTasks,
      tasksByStatus,
      overdueTasks,
      completedThisWeek,
      assignedThisWeek,
      blockedTasks,
      totalProjects,
      projectsByStatus,
      totalMembers,
      upcomingMilestones,
      recentActivity,
      weeklyTimeLogged,
      tasksWithScores,
      pendingApprovals,
      overdueSeverity,
    ] = await Promise.all([
      // Total tasks
      Task.countDocuments(filter),

      // Tasks by status
      Task.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Overdue tasks (non-completed, due date < today)
      Task.countDocuments({
        ...filter,
        status: { $nin: ["Completed", "completed"] },
        dueDate: { $lt: now, $ne: null },
      }),

      // Tasks completed this week
      Task.countDocuments({
        ...filter,
        status: { $in: ["Completed", "completed"] },
        completionDate: { $gte: startOfWeek, $lt: endOfWeek },
      }),

      // Tasks assigned as of this week
      Task.countDocuments({
        ...filter,
        createdDate: { $lte: endOfWeek },
        $or: [
          { completionDate: null },
          { completionDate: { $gte: startOfWeek } },
        ],
      }),

      // Blocked tasks
      Task.countDocuments({ ...filter, isBlocked: true }),

      // Total projects
      Project.countDocuments(workspaceId ? { workspaceId } : {}),

      // Projects by status
      Project.aggregate([
        { $match: workspaceId ? { workspaceId } : {} },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Total team members (employees)
      Employee.countDocuments({}),

      // Upcoming milestones (next 3)
      Milestone.find({
        ...(workspaceId ? { workspaceId } : {}),
        status: { $nin: ["Completed", "completed"] },
        dueDate: { $gte: now },
      })
        .sort({ dueDate: 1 })
        .limit(3)
        .lean(),

      // Recent activity (last 10)
      ActivityLog.find(workspaceId ? { workspaceId } : {})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Time logged this week
      TimeLog.aggregate([
        {
          $match: {
            ...(workspaceId ? { workspaceId } : {}),
            date: { $gte: startOfWeek, $lt: endOfWeek },
          },
        },
        { $group: { _id: null, totalHours: { $sum: "$hours" } } },
      ]),

      // Average manager score on completed tasks
      Task.aggregate([
        {
          $match: {
            ...filter,
            status: { $in: ["Completed", "completed"] },
            managerScore: { $exists: true, $ne: null },
          },
        },
        { $group: { _id: null, avgScore: { $avg: "$managerScore" } } },
      ]),

      // Pending approvals
      Task.countDocuments({ ...filter, approvalStatus: "pending" }),

      // Overdue severity breakdown
      Task.aggregate([
        {
          $match: {
            ...filter,
            status: { $nin: ["Completed", "completed"] },
            dueDate: { $lt: now, $ne: null },
          },
        },
        {
          $project: {
            daysOverdue: {
              $divide: [{ $subtract: [now, "$dueDate"] }, 86400000],
            },
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $lte: ["$daysOverdue", 3] },
                "1-3 days",
                {
                  $cond: [
                    { $lte: ["$daysOverdue", 7] },
                    "4-7 days",
                    ">7 days",
                  ],
                },
              ],
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // ── Build status maps ────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    tasksByStatus.forEach((s: any) => {
      statusMap[s._id || "Unknown"] = s.count;
    });

    const projectStatusMap: Record<string, number> = {};
    projectsByStatus.forEach((s: any) => {
      projectStatusMap[s._id || "Unknown"] = s.count;
    });

    const overdueMap: Record<string, number> = {};
    overdueSeverity.forEach((s: any) => {
      overdueMap[s._id] = s.count;
    });

    // ── Completion metrics ───────────────────────────────────────
    const completedTasks = (statusMap["Completed"] || 0) + (statusMap["completed"] || 0);
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const timeLoggedHours = weeklyTimeLogged[0]?.totalHours || 0;
    const avgScore = tasksWithScores[0]?.avgScore ? Math.round(tasksWithScores[0].avgScore * 10) / 10 : null;

    // Calculate % completed on time
    const completedOnTimeCount = await Task.countDocuments({
      ...filter,
      status: { $in: ["Completed", "completed"] },
      completedOnTime: true,
    });
    const onTimeRate = completedTasks > 0 ? Math.round((completedOnTimeCount / completedTasks) * 100) : 0;

    return NextResponse.json({
      summary: {
        totalTasks,
        totalProjects,
        totalMembers,
        completedTasks,
        completionRate,
        overdueTasks,
        blockedTasks,
        pendingApprovals,
        onTimeRate,
        avgScore,
      },
      weeklyMetrics: {
        completedThisWeek,
        assignedThisWeek,
        timeLoggedHours: Math.round(timeLoggedHours * 10) / 10,
      },
      taskStatusBreakdown: statusMap,
      projectStatusBreakdown: projectStatusMap,
      overdueSeverity: overdueMap,
      upcomingMilestones,
      recentActivity,
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
