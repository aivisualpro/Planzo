
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Workspace from "@/lib/models/Workspace";
import Employee from "@/lib/models/Employee";
import Project from "@/lib/models/Project";
import Milestone from "@/lib/models/Milestone";
import Task from "@/lib/models/Task";
import SubTask from "@/lib/models/SubTask";

// CSV Header → Schema field mapping
const workspaceHeaderMap: Record<string, string> = {
  "Workspace ID": "workspaceId",
  "Workspace Team": "workspaceTeam",
  "Workspace Description": "workspaceDescription",
  "Team Members": "teamMembers",
  "Image": "image",
  "Color Type": "colorType",
  "Delete": "isDeleted",
  "Created By": "createdBy",
  "Date Created": "dateCreated",
};

const employeeHeaderMap: Record<string, string> = {
  "Unique ID": "uniqueId",
  "Employee ID": "employeeId",
  "Full Name": "fullName",
  "Role": "role",
  "Email": "email",
  "Picture": "picture",
  "Color": "color",
  "Initials for card": "initials",
  "Sort": "sort",
  "Password": "password",
};

const projectHeaderMap: Record<string, string> = {
  "Project ID": "projectId",
  "Workspace ID": "workspaceId",
  "Project Name": "projectName",
  "Project Description": "projectDescription",
  "Start Date": "startDate",
  "End Date": "endDate",
  "Assignee": "assignee",
  "Project Members": "projectMembers",
  "Priority Level": "priorityLevel",
  "Status": "status",
  "Created By": "createdBy",
  "Created Date": "createdDate",
  "Completed By": "completedBy",
  "Completion Date": "completionDate",
};

const milestoneHeaderMap: Record<string, string> = {
  "Milestone ID": "milestoneId",
  "Milestone Name": "milestoneName",
  "Workspace ID": "workspaceId",
  "Project ID": "projectId",
  "Due Date": "dueDate",
  "Notes": "notes",
  "Photo Drop": "photoDrop",
  "Status": "status",
  "Created By": "createdBy",
  "Created Date": "createdDate",
  "Completed By": "completedBy",
  "Completion Date": "completionDate",
};

const taskHeaderMap: Record<string, string> = {
  "Task ID": "taskId",
  "Workspace ID": "workspaceId",
  "Project ID": "projectId",
  "Milestone ID": "milestoneId",
  "Task Name": "taskName",
  "Task Description": "taskDescription",
  "Priority": "priority",
  "Start Date": "startDate",
  "Due Date": "dueDate",
  "Assignee": "assignee",
  "Collaborator": "collaborator",
  "Status": "status",
  "Created By": "createdBy",
  "Created Date": "createdDate",
  "Completed By": "completedBy",
  "Completion Date": "completionDate",
};

const subtaskHeaderMap: Record<string, string> = {
  "Subtask ID": "subtaskId",
  "Task ID": "taskId",
  "Sub Task": "subTask",
  "Status": "status",
  "Created By": "createdBy",
  "Created Date": "createdDate",
  "Completed By": "completedBy",
  "Completion Date": "completionDate",
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, data } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    await connectToDatabase();

    if (type === "workspaces") {
      const operations = data.map((row: any) => {
        const processedData: any = {};

        // Map CSV headers to schema fields
        Object.entries(row).forEach(([header, value]) => {
          const schemaKey = workspaceHeaderMap[header.trim()];
          if (!schemaKey || value === undefined || value === null || value === "") return;

          const strValue = value.toString().trim();

          if (schemaKey === "teamMembers") {
            // Split comma-separated team members into array
            processedData[schemaKey] = strValue
              .split(",")
              .map((m: string) => m.trim())
              .filter((m: string) => m.length > 0);
          } else if (schemaKey === "isDeleted") {
            const lower = strValue.toLowerCase();
            processedData[schemaKey] = lower === "true" || lower === "yes" || lower === "1";
          } else if (schemaKey === "dateCreated") {
            try {
              const date = new Date(strValue);
              if (!isNaN(date.getTime())) {
                processedData[schemaKey] = date;
              }
            } catch {
              // Ignore invalid dates
            }
          } else {
            processedData[schemaKey] = strValue;
          }
        });

        // workspaceId is required for upsert
        if (!processedData.workspaceId) return null;

        return {
          updateOne: {
            filter: { workspaceId: processedData.workspaceId },
            update: { $set: processedData },
            upsert: true,
          },
        };
      }).filter((op: any): op is NonNullable<typeof op> => op !== null);

      if (operations.length > 0) {
        const result = await Workspace.bulkWrite(operations);
        return NextResponse.json({
          success: true,
          count: (result.upsertedCount || 0) + (result.modifiedCount || 0),
          inserted: result.upsertedCount || 0,
          updated: result.modifiedCount || 0,
          matched: result.matchedCount,
        });
      }
      return NextResponse.json({ success: true, count: 0, inserted: 0, updated: 0 });
    }

    // ── Employees Import ──
    if (type === "employees") {
      const operations = data.map((row: any) => {
        const processedData: any = {};

        Object.entries(row).forEach(([header, value]) => {
          const schemaKey = employeeHeaderMap[header.trim()];
          if (!schemaKey || value === undefined || value === null || value === "") return;

          const strValue = value.toString().trim();

          if (schemaKey === "sort") {
            const num = parseInt(strValue, 10);
            if (!isNaN(num)) processedData[schemaKey] = num;
          } else {
            processedData[schemaKey] = strValue;
          }
        });

        // uniqueId is required for upsert
        if (!processedData.uniqueId) return null;

        return {
          updateOne: {
            filter: { uniqueId: processedData.uniqueId },
            update: { $set: processedData },
            upsert: true,
          },
        };
      }).filter((op: any): op is NonNullable<typeof op> => op !== null);

      if (operations.length > 0) {
        const result = await Employee.bulkWrite(operations);
        return NextResponse.json({
          success: true,
          count: (result.upsertedCount || 0) + (result.modifiedCount || 0),
          inserted: result.upsertedCount || 0,
          updated: result.modifiedCount || 0,
          matched: result.matchedCount,
        });
      }

      return NextResponse.json({ success: true, count: 0, inserted: 0, updated: 0 });
    }

    // ── Projects Import ──
    if (type === "projects") {
      const dateFields = ["startDate", "endDate", "createdDate", "completionDate"];

      const operations = data.map((row: any) => {
        const processedData: any = {};

        Object.entries(row).forEach(([header, value]) => {
          const schemaKey = projectHeaderMap[header.trim()];
          if (!schemaKey || value === undefined || value === null || value === "") return;

          const strValue = value.toString().trim();

          if (schemaKey === "projectMembers") {
            processedData[schemaKey] = strValue
              .split(",")
              .map((m: string) => m.trim())
              .filter((m: string) => m.length > 0);
          } else if (dateFields.includes(schemaKey)) {
            try {
              const date = new Date(strValue);
              if (!isNaN(date.getTime())) {
                processedData[schemaKey] = date;
              }
            } catch {
              // Ignore invalid dates
            }
          } else {
            processedData[schemaKey] = strValue;
          }
        });

        if (!processedData.projectId) return null;

        return {
          updateOne: {
            filter: { projectId: processedData.projectId },
            update: { $set: processedData },
            upsert: true,
          },
        };
      }).filter((op: any): op is NonNullable<typeof op> => op !== null);

      if (operations.length > 0) {
        const result = await Project.bulkWrite(operations);
        return NextResponse.json({
          success: true,
          count: (result.upsertedCount || 0) + (result.modifiedCount || 0),
          inserted: result.upsertedCount || 0,
          updated: result.modifiedCount || 0,
          matched: result.matchedCount,
        });
      }

      return NextResponse.json({ success: true, count: 0, inserted: 0, updated: 0 });
    }

    // ── Milestones Import ──
    if (type === "milestones") {
      const dateFields = ["dueDate", "createdDate", "completionDate"];

      const operations = data.map((row: any) => {
        const processedData: any = {};

        Object.entries(row).forEach(([header, value]) => {
          const schemaKey = milestoneHeaderMap[header.trim()];
          if (!schemaKey || value === undefined || value === null || value === "") return;

          const strValue = value.toString().trim();

          if (dateFields.includes(schemaKey)) {
            try {
              const date = new Date(strValue);
              if (!isNaN(date.getTime())) {
                processedData[schemaKey] = date;
              }
            } catch {
              // Ignore invalid dates
            }
          } else {
            processedData[schemaKey] = strValue;
          }
        });

        if (!processedData.milestoneId) return null;

        return {
          updateOne: {
            filter: { milestoneId: processedData.milestoneId },
            update: { $set: processedData },
            upsert: true,
          },
        };
      }).filter((op: any): op is NonNullable<typeof op> => op !== null);

      if (operations.length > 0) {
        const result = await Milestone.bulkWrite(operations);
        return NextResponse.json({
          success: true,
          count: (result.upsertedCount || 0) + (result.modifiedCount || 0),
          inserted: result.upsertedCount || 0,
          updated: result.modifiedCount || 0,
          matched: result.matchedCount,
        });
      }

      return NextResponse.json({ success: true, count: 0, inserted: 0, updated: 0 });
    }

    // ── Tasks Import ──
    if (type === "tasks") {
      const dateFields = ["startDate", "dueDate", "createdDate", "completionDate"];

      const operations = data.map((row: any) => {
        const processedData: any = {};

        Object.entries(row).forEach(([header, value]) => {
          const schemaKey = taskHeaderMap[header.trim()];
          if (!schemaKey || value === undefined || value === null || value === "") return;

          const strValue = value.toString().trim();

          if (dateFields.includes(schemaKey)) {
            try {
              const date = new Date(strValue);
              if (!isNaN(date.getTime())) {
                processedData[schemaKey] = date;
              }
            } catch {
              // Ignore invalid dates
            }
          } else {
            processedData[schemaKey] = strValue;
          }
        });

        if (!processedData.taskId) return null;

        return {
          updateOne: {
            filter: { taskId: processedData.taskId },
            update: { $set: processedData },
            upsert: true,
          },
        };
      }).filter((op: any): op is NonNullable<typeof op> => op !== null);

      if (operations.length > 0) {
        const result = await Task.bulkWrite(operations);
        return NextResponse.json({
          success: true,
          count: (result.upsertedCount || 0) + (result.modifiedCount || 0),
          inserted: result.upsertedCount || 0,
          updated: result.modifiedCount || 0,
          matched: result.matchedCount,
        });
      }

      return NextResponse.json({ success: true, count: 0, inserted: 0, updated: 0 });
    }

    // ── SubTasks Import ──
    if (type === "subtasks") {
      const dateFields = ["createdDate", "completionDate"];

      const operations = data.map((row: any) => {
        const processedData: any = {};

        Object.entries(row).forEach(([header, value]) => {
          const schemaKey = subtaskHeaderMap[header.trim()];
          if (!schemaKey || value === undefined || value === null || value === "") return;

          const strValue = value.toString().trim();

          if (dateFields.includes(schemaKey)) {
            try {
              const date = new Date(strValue);
              if (!isNaN(date.getTime())) {
                processedData[schemaKey] = date;
              }
            } catch {
              // Ignore invalid dates
            }
          } else {
            processedData[schemaKey] = strValue;
          }
        });

        if (!processedData.subtaskId) return null;

        return {
          updateOne: {
            filter: { subtaskId: processedData.subtaskId },
            update: { $set: processedData },
            upsert: true,
          },
        };
      }).filter((op: any): op is NonNullable<typeof op> => op !== null);

      if (operations.length > 0) {
        const result = await SubTask.bulkWrite(operations);
        return NextResponse.json({
          success: true,
          count: (result.upsertedCount || 0) + (result.modifiedCount || 0),
          inserted: result.upsertedCount || 0,
          updated: result.modifiedCount || 0,
          matched: result.matchedCount,
        });
      }

      return NextResponse.json({ success: true, count: 0, inserted: 0, updated: 0 });
    }

    return NextResponse.json({ error: "Invalid import type" }, { status: 400 });

  } catch (error: any) {
    console.error("Import API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
