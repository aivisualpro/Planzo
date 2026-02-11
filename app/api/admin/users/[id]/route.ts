import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Employee from "@/lib/models/Employee";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const item = await Employee.findById(id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const session = await getSession();
    const body = await req.json();
    const updatedItem = await Employee.findByIdAndUpdate(id, body, { new: true });
    if (!updatedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // ── Audit ──
    logAudit({
      eventType: "member_added",
      description: `User "${updatedItem.fullName || updatedItem.email}" was updated`,
      performedBy: session?.email || session?.id || "system",
      performedByName: session?.name,
      field: Object.keys(body).join(", "),
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const session = await getSession();
    const deletedItem = await Employee.findByIdAndDelete(id);
    if (!deletedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // ── Audit ──
    logAudit({
      eventType: "member_removed",
      description: `User "${deletedItem.fullName || deletedItem.email}" was removed`,
      performedBy: session?.email || session?.id || "system",
      performedByName: session?.name,
      oldValue: deletedItem.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
