import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import AuditTrail from "@/lib/models/AuditTrail";

// GET: Fetch audit trail entries with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");
    const eventType = searchParams.get("eventType");
    const performedBy = searchParams.get("performedBy");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const filter: any = {};
    if (workspaceId) filter.workspaceId = workspaceId;
    if (projectId) filter.projectId = projectId;
    if (taskId) filter.taskId = taskId;
    if (eventType) filter.eventType = eventType;
    if (performedBy) filter.performedBy = performedBy;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { performedByName: { $regex: search, $options: "i" } },
        { taskName: { $regex: search, $options: "i" } },
        { projectName: { $regex: search, $options: "i" } },
      ];
    }

    const [entries, total] = await Promise.all([
      AuditTrail.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditTrail.countDocuments(filter),
    ]);

    return NextResponse.json({
      entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Audit Trail API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create audit trail entry
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const eventId = `AE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const entry = new AuditTrail({
      eventId,
      ...body,
      performedBy: body.performedBy || session.email || session.id,
      performedByName: body.performedByName || session.name,
    });

    await entry.save();

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    console.error("Audit Trail Create Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
