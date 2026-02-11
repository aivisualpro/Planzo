
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const session = await getSession();
    const role = session?.role;
    if (!role) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const employees = await Employee.find({})
      .sort({ createdAt: -1 });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('[EMPLOYEES_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    const role = session?.role;
    
    if (!role) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    
    const existingEmployee = await Employee.findOne({ email: body.email });
    if (existingEmployee) {
      return new NextResponse("Email already exists", { status: 409 });
    }

    const employee = await Employee.create(body);

    // ── Audit ──
    logAudit({
      eventType: "member_added",
      description: `Employee "${employee.fullName}" was added`,
      performedBy: session?.email || session?.id || "system",
      performedByName: session?.name,
      newValue: employee.email,
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('[EMPLOYEES_POST]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

