import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Task from "@/lib/models/Task";
import TimeLog from "@/lib/models/TimeLog";
import ActivityLog from "@/lib/models/ActivityLog";

// GET: Weekly member report
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0"); // 0 = current, -1 = last week

    // Calculate week boundaries (Sun-Sat)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const filter: any = {};
    if (workspaceId && workspaceId !== "all") filter.workspaceId = workspaceId;

    // Get all unique assignees
    const assignees = await Task.distinct("assignee", { ...filter, assignee: { $nin: [null, ""] } });

    const memberReports = await Promise.all(
      assignees.filter(Boolean).map(async (member: string) => {
        const memberFilter = { ...filter, assignee: member };

        const [
          completedThisWeek,
          assignedAsOfWeek,
          completedOnTime,
          totalCompleted,
          overdueTasks,
          blockedTasks,
          pendingApprovals,
          avgScore,
          timeLogged,
          activityCount,
          upcomingTasks,
        ] = await Promise.all([
          // Tasks completed this week
          Task.countDocuments({
            ...memberFilter,
            status: { $in: ["Completed", "completed"] },
            completionDate: { $gte: startOfWeek, $lt: endOfWeek },
          }),
          // Tasks assigned
          Task.countDocuments({
            ...memberFilter,
            createdDate: { $lte: endOfWeek },
          }),
          // Completed on time
          Task.countDocuments({
            ...memberFilter,
            status: { $in: ["Completed", "completed"] },
            completedOnTime: true,
          }),
          // Total completed ever
          Task.countDocuments({
            ...memberFilter,
            status: { $in: ["Completed", "completed"] },
          }),
          // Overdue now
          Task.countDocuments({
            ...memberFilter,
            status: { $nin: ["Completed", "completed"] },
            dueDate: { $lt: now, $ne: null },
          }),
          // Blocked
          Task.countDocuments({ ...memberFilter, isBlocked: true }),
          // Pending approvals
          Task.countDocuments({ ...memberFilter, approvalStatus: "pending" }),
          // Avg manager score
          Task.aggregate([
            {
              $match: {
                ...memberFilter,
                status: { $in: ["Completed", "completed"] },
                managerScore: { $exists: true, $ne: null },
              },
            },
            { $group: { _id: null, avg: { $avg: "$managerScore" } } },
          ]),
          // Time logged this week
          TimeLog.aggregate([
            {
              $match: {
                userId: member,
                date: { $gte: startOfWeek, $lt: endOfWeek },
              },
            },
            { $group: { _id: null, total: { $sum: "$hours" } } },
          ]),
          // Activity count this week
          ActivityLog.countDocuments({
            author: member,
            createdAt: { $gte: startOfWeek, $lt: endOfWeek },
          }),
          // Coming week tasks (ordered by priority)
          Task.find({
            ...memberFilter,
            status: { $nin: ["Completed", "completed"] },
          })
            .sort({ priority: 1, dueDate: 1 })
            .limit(10)
            .select("taskId taskName priority dueDate status isBlocked projectId")
            .lean(),
        ]);

        const onTimeRate = totalCompleted > 0 ? Math.round((completedOnTime / totalCompleted) * 100) : 0;
        const hoursLogged = timeLogged[0]?.total || 0;
        const capacityHours = 40; // standard work week
        const utilisationPct = Math.round((hoursLogged / capacityHours) * 100);
        const score = avgScore[0]?.avg ? Math.round(avgScore[0].avg * 10) / 10 : null;

        return {
          member,
          completedThisWeek,
          assignedAsOfWeek,
          onTimeRate,
          hoursLogged: Math.round(hoursLogged * 10) / 10,
          utilisationPct,
          pendingApprovals,
          qualityScore: score,
          overdueTasks,
          blockedTasks,
          activityCount,
          upcomingTasks,
        };
      })
    );

    // Sort by overdue tasks desc, then by name
    memberReports.sort((a, b) => b.overdueTasks - a.overdueTasks || a.member.localeCompare(b.member));

    return NextResponse.json({
      weekStart: startOfWeek.toISOString(),
      weekEnd: endOfWeek.toISOString(),
      members: memberReports,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
