import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const items = await User.find({}, 
      "name email phone AppRole designation isActive serialNo profilePicture location createdAt"
    ).lean();
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    const body = await req.json();
    const newItem = await User.create(body);

    // ── Audit ──
    logAudit({
      eventType: "member_added",
      description: `User "${newItem.name || newItem.email}" was created`,
      performedBy: session?.email || session?.id || "system",
      performedByName: session?.name,
      newValue: newItem.email,
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

