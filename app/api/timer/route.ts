import { NextRequest, NextResponse } from 'next/server';
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Employee from "@/lib/models/Employee";
import Task from "@/lib/models/Task";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const employee = await Employee.findOne({ email: session.email }).select('activeTaskTimer');

    if (!employee) {
      // Return null timer gracefully instead of 404 (e.g. Super Admin bypass)
      return NextResponse.json({ activeTimer: null });
    }

    return NextResponse.json({ activeTimer: employee.activeTaskTimer || null });
  } catch (error) {
    console.error("Error fetching active timer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, taskId } = await req.json();
    await connectToDatabase();

    // Find or create employee record for this session
    let employee = await Employee.findOne({ email: session.email });
    if (!employee) {
      // Auto-create an employee record (handles Super Admin or new users)
      employee = await Employee.create({
        uniqueId: `EMP-${Date.now()}`,
        fullName: session.name || 'Unknown',
        email: session.email,
        role: session.role || 'Manager',
      });
    }

    if (action === 'start') {
      if (employee.activeTaskTimer) {
        // Auto-stop the previous timer
        const prevTask = await Task.findOne({ taskId: employee.activeTaskTimer.taskId });
        if (prevTask) {
             const startTime = new Date(employee.activeTaskTimer.startTime);
             const endTime = new Date();
             const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
             
             // Update previous task timeLogged
             await Task.updateOne(
                { taskId: employee.activeTaskTimer.taskId },
                { $inc: { timeLogged: durationHours } }
             );
        }
      }

      // Start new timer
      const task = await Task.findOne({ taskId });
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      employee.activeTaskTimer = {
        taskId,
        startTime: new Date(),
        taskName: task.taskName
      };
      await employee.save();

      return NextResponse.json({ activeTimer: employee.activeTaskTimer });
    } 
    
    if (action === 'stop') {
      if (!employee.activeTaskTimer) {
        return NextResponse.json({ message: "No active timer to stop" });
      }

      const activeTask = employee.activeTaskTimer;
      const startTime = new Date(activeTask.startTime);
      const endTime = new Date();
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      // Update task timeLogged
      await Task.updateOne(
        { taskId: activeTask.taskId },
        { $inc: { timeLogged: durationHours } }
      );

      // Clear timer
      employee.activeTaskTimer = undefined;
      await employee.save();

      return NextResponse.json({ message: "Timer stopped", duration: durationHours });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error updating timer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
