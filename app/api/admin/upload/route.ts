import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Configure Cloudinary — prefer CLOUDINARY_URL (contains everything) with individual vars as fallback
if (!cloudinary.config().cloud_name) {
  if (process.env.CLOUDINARY_URL) {
    // CLOUDINARY_URL auto-configures the SDK
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "planzo/uploads";
    const taskId = formData.get("taskId") as string | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    // Audit trail (fire-and-forget)
    if (session) {
      logAudit({
        eventType: "attachment_added",
        description: `File "${file.name}" uploaded to ${folder}`,
        performedBy: session.email || session.id,
        performedByName: session.name,
        taskId: taskId || undefined,
        projectId: projectId || undefined,
        newValue: result?.secure_url || result?.url,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Upload Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}

