import { NextResponse } from "next/server";
import { getSession, logout } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Employee from "@/lib/models/Employee";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Super Admin bypass — no DB employee to look up
  if (session.id === "super-admin") {
    return NextResponse.json({ authenticated: true, user: session });
  }

  await connectToDatabase();
  const employee = await Employee.findOne({ email: session.email });

  if (!employee) {
    await logout();
    return NextResponse.json({ authenticated: false, error: "Account not found" }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, user: { ...session, employeeId: employee._id.toString() } });
}
