import { NextResponse } from "next/server";
import { login } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Employee from "@/lib/models/Employee";

export async function POST(request: Request) {
  console.log("[Auth API] Login request received");
  try {
    const { email, password } = await request.json();
    console.log(`[Auth API] Attempting login for: ${email}`);

    // ── Super Admin Bypass ──────────────────────────────────────────
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (
      superAdminEmail &&
      superAdminPassword &&
      email.toLowerCase() === superAdminEmail.toLowerCase() &&
      password === superAdminPassword
    ) {
      console.log("[Auth API] Super Admin login bypass");
      const superAdminData = {
        id: "super-admin",
        email: superAdminEmail.toLowerCase(),
        name: "Super Admin",
        role: "Super Admin",
        avatar: "/logo.png",
      };
      await login(superAdminData);
      return NextResponse.json({ success: true, user: superAdminData });
    }
    // ────────────────────────────────────────────────────────────────

    const start = Date.now();
    await connectToDatabase();
    const dbEnd = Date.now();
    console.log(`[Auth API] DB Connection took: ${dbEnd - start}ms`);
    
    const employee = await Employee.findOne({ email: email.toLowerCase() });
    const userEnd = Date.now();
    console.log(`[Auth API] Employee Lookup took: ${userEnd - dbEnd}ms`);

    // Employee uses strict: false, so password may exist as an extra field
    const empPassword = (employee as any)?.password;
    if (!employee || empPassword !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const userData = {
      id: employee._id.toString(),
      email: employee.email,
      name: employee.fullName,
      role: (employee as any).AppRole || employee.role || "Manager",
      avatar: employee.picture || "/logo.png",
    };

    const loginStart = Date.now();
    await login(userData);
    console.log(`[Auth API] Session creation took: ${Date.now() - loginStart}ms`);

    return NextResponse.json({ success: true, user: userData });
  } catch (error: any) {
    console.error("[Auth API] Login Error:", error);
    return NextResponse.json({ 
      error: error.message || "Authentication failed",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}
