import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Employee from "@/lib/models/Employee";

// GET: Lookup employee names by emails
// ?emails=a@b.com,c@d.com → { "a@b.com": "John Doe", "c@d.com": "Jane Smith" }
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const emailsParam = searchParams.get("emails");

    if (!emailsParam) {
      // Return all employees as a lookup map
      const employees = await Employee.find({}).select("email fullName").lean();
      const map: Record<string, string> = {};
      employees.forEach((e: any) => {
        if (e.email) map[e.email] = e.fullName;
      });
      return NextResponse.json({ map });
    }

    const emails = emailsParam.split(",").map(e => e.trim()).filter(Boolean);
    const employees = await Employee.find({ email: { $in: emails } }).select("email fullName").lean();
    
    const map: Record<string, string> = {};
    employees.forEach((e: any) => {
      if (e.email) map[e.email] = e.fullName;
    });

    return NextResponse.json({ map });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
