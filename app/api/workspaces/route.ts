import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Workspace from "@/lib/models/Workspace";

// GET: Fetch all workspaces for the current user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const workspaces = await Workspace.find({ isDeleted: { $ne: true } })
      .select("workspaceId workspaceTeam workspaceDescription image colorType")
      .sort({ workspaceTeam: 1 })
      .lean();

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 });
  }
}
