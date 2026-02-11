import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Employee from "@/lib/models/Employee";
import AppRole from "@/lib/models/AppRole";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // ── Super Admin Bypass ──────────────────────────────────────────
    if (session.id === "super-admin") {
      return NextResponse.json({ role: "Super Admin", permissions: [] });
    }
    // ────────────────────────────────────────────────────────────────
    
    // 1. Get Employee to find their Role Name
    const employee = await Employee.findOne({ email: session.email });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // 2. Get Role Definition
    const roleName = (employee as any).AppRole || employee.role || "Manager";
    const role = await AppRole.findOne({ name: roleName });
    
    let allowedModules: string[] = [];

    if (role && role.permissions) {
      allowedModules = role.permissions
        .filter((p: any) => p.actions.view === true)
        .map((p: any) => p.module);
    } 

    return NextResponse.json({ 
      role: roleName,
      permissions: role ? role.permissions : [] 
    });

  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}
