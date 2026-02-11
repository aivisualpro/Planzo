
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import Task from "@/lib/models/Task";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.email }).select('activeTaskTimer');

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ activeTimer: user.activeTaskTimer || null });
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

    const user = await User.findOne({ email: session.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === 'start') {
      if (user.activeTaskTimer) {
        // Stop current timer first? Or just error?
        // Let's auto-stop the previous timer to be safe.
        // Or simply overwrite. If we overwrite, we lose the previous time.
        // Better to stop it properly.
        const prevTask = await Task.findOne({ taskId: user.activeTaskTimer.taskId });
        if (prevTask) {
             const startTime = new Date(user.activeTaskTimer.startTime);
             const endTime = new Date();
             const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
             
             // Update previous task timeLogged
             await Task.updateOne(
                { taskId: user.activeTaskTimer.taskId },
                { $inc: { timeLogged: durationHours } }
             );
        }
      }

      // Start new timer
      const task = await Task.findOne({ taskId });
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      user.activeTaskTimer = {
        taskId,
        startTime: new Date(),
        taskName: task.taskName
      };
      await user.save();

      return NextResponse.json({ activeTimer: user.activeTaskTimer });
    } 
    
    if (action === 'stop') {
      if (!user.activeTaskTimer) {
        return NextResponse.json({ message: "No active timer to stop" });
      }

      const activeTask = user.activeTaskTimer;
      const startTime = new Date(activeTask.startTime);
      const endTime = new Date();
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      // Update task timeLogged
      await Task.updateOne(
        { taskId: activeTask.taskId },
        { $inc: { timeLogged: durationHours } }
      );

      // Clear timer
      user.activeTaskTimer = undefined;
      await user.save();

      return NextResponse.json({ message: "Timer stopped", duration: durationHours });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error updating timer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
