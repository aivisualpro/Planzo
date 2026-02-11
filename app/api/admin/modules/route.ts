import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import AppModule from "@/lib/models/AppModule";
import CardConfig from "@/lib/models/CardConfig";

// Default modules for auto-seeding
const DEFAULT_MODULES = [
  { name: "Dashboard", url: "/dashboard", icon: "IconDashboard", order: 0, subModules: [] },
  { name: "Tasks", url: "/tasks", icon: "IconListCheck", order: 1, subModules: [] },
  { name: "Projects", url: "/projects", icon: "IconFolderOpen", order: 2, subModules: [] },
  { name: "Approvals", url: "/approvals", icon: "IconChecklist", order: 3, subModules: [] },
  { name: "Weekly Report", url: "/weekly-report", icon: "IconCalendarWeek", order: 4, subModules: [] },
  { name: "Audit Trail", url: "/audit-trail", icon: "IconShieldCheck", order: 5, subModules: [] },
  { name: "Reports", url: "/reports", icon: "IconChartBar", order: 6, subModules: [] },
];

// GET: Fetch all modules (ordered) — auto-seeds on first request
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // One-time cleanup: remove deprecated modules from DB
    const REMOVED_MODULES = ["Owner", "Dispatch", "Scheduling", "Everyday", "Fleet", "HR", "Incidents", "Insurance", "Manager"];
    await AppModule.deleteMany({ name: { $in: REMOVED_MODULES } });

    // Force update order for Audit Trail and Reports
    await AppModule.updateOne({ name: "Audit Trail" }, { $set: { order: 5 } });
    await AppModule.updateOne({ name: "Reports" }, { $set: { order: 6 } });

    let modules = await AppModule.find({}).sort({ order: 1 }).lean();

    // Auto-seed if collection is empty
    if (modules.length === 0) {
      await AppModule.insertMany(DEFAULT_MODULES);
      modules = await AppModule.find({}).sort({ order: 1 }).lean();
    } else {
      // Auto-patch: sync sub-modules/URLs from DEFAULT_MODULES for modules
      // that were seeded with empty sub-modules but now have defaults
      for (const defaultMod of DEFAULT_MODULES) {
        const dbMod = modules.find((m: any) => m.name === defaultMod.name);
        if (dbMod) {
          let needsUpdate = false;
          const updates: any = {};

          // Patch URL if it was "#" and default now has a real URL
          if ((dbMod as any).url === "#" && defaultMod.url !== "#") {
            updates.url = defaultMod.url;
            needsUpdate = true;
          }

          // Patch sub-modules if DB has none but defaults have them
          if ((!((dbMod as any).subModules) || (dbMod as any).subModules.length === 0) && defaultMod.subModules.length > 0) {
            updates.subModules = defaultMod.subModules;
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            await AppModule.updateOne({ _id: (dbMod as any)._id }, { $set: updates });
          }
        } else {
          // Module doesn't exist in DB yet — insert it
          await AppModule.create(defaultMod);
        }
      }

      // Re-fetch after patches/inserts
      modules = await AppModule.find({}).sort({ order: 1 }).lean();
    }

    // Merge card-config display names into sub-modules
    // Card-config is the source of truth for display names set by Super Admin
    try {
      const cardConfigs = await CardConfig.find({}).lean();
      if (cardConfigs.length > 0) {
        modules = modules.map((mod: any) => {
          const pageName = mod.name.toLowerCase(); // e.g. "Reports" → "reports"
          const config = cardConfigs.find((c: any) => c.page === pageName);
          if (config && config.cards && config.cards.length > 0 && mod.subModules?.length > 0) {
            const updatedSubs = mod.subModules.map((sm: any, idx: number) => {
              const cardOverride = config.cards.find((c: any) => c.index === idx);
              if (cardOverride?.name) {
                return { ...sm, name: cardOverride.name };
              }
              return sm;
            });
            return { ...mod, subModules: updatedSubs };
          }
          return mod;
        });
      }
    } catch (mergeErr) {
      // Non-critical — continue with DB names
      console.error("Failed to merge card-config names:", mergeErr);
    }

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Error fetching modules:", error);
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
  }
}

// POST: Seed initial modules (only if collection is empty)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const existingCount = await AppModule.countDocuments();
    if (existingCount > 0) {
      return NextResponse.json({ message: "Modules already seeded", count: existingCount });
    }

    const defaultModules = [
      {
        name: "Dashboard",
        url: "/dashboard",
        icon: "IconDashboard",
        order: 0,
        subModules: [],
      },
      {
        name: "Reports",
        url: "/reports",
        icon: "IconChartBar",
        order: 1,
        subModules: [],
      },
    ];

    await AppModule.insertMany(defaultModules);

    return NextResponse.json({ message: "Modules seeded successfully", count: defaultModules.length });
  } catch (error) {
    console.error("Error seeding modules:", error);
    return NextResponse.json({ error: "Failed to seed modules" }, { status: 500 });
  }
}
