
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { getSession } from "@/lib/auth";
import Employee from "@/lib/models/Employee";
import { logAudit } from "@/lib/audit";

type RouteProps = {
  params: Promise<{ id: string }>;
};

// GET single employee
export async function GET(
  req: Request,
  props: RouteProps
) {
  try {
    await connectToDatabase();
    
    const session = await getSession();
    const role = session?.role;
    if (!role) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const params = await props.params;

    const employee = await Employee.findById(params.id);
    if (!employee) {
      return new NextResponse("Employee not found", { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("GET /api/admin/employees/[id] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// UPDATE employee
export async function PUT(
  req: Request,
  props: RouteProps
) {
  try {
    await connectToDatabase();
    const session = await getSession();
    const role = session?.role;
    if (!role) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const params = await props.params;
    const body = await req.json();

    delete body._id;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return new NextResponse("Employee not found", { status: 404 });
    }

    // ── Audit ──
    logAudit({
      eventType: "member_added",
      description: `Employee "${updatedEmployee.fullName}" profile was updated`,
      performedBy: session?.email || session?.id || "system",
      performedByName: session?.name,
      field: Object.keys(body).join(", "),
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("PUT /api/admin/employees/[id] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE employee
export async function DELETE(
  req: Request,
  props: RouteProps
) {
  try {
    await connectToDatabase();
    const session = await getSession();
    const role = session?.role;
    if (!role) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const params = await props.params;

    const deletedEmployee = await Employee.findByIdAndDelete(params.id);

    if (!deletedEmployee) {
      return new NextResponse("Employee not found", { status: 404 });
    }

    // ── Audit ──
    logAudit({
      eventType: "member_removed",
      description: `Employee "${deletedEmployee.fullName}" was removed`,
      performedBy: session?.email || session?.id || "system",
      performedByName: session?.name,
      oldValue: deletedEmployee.email,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/employees/[id] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

