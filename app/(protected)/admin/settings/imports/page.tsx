"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FolderKanban, Users, Briefcase, Flag, CheckSquare, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ImportsSettingsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [importType, setImportType] = useState<string>("workspaces");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = (type: string) => {
    setImportType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const importLabel = importType === "workspaces" ? "Workspaces" : importType === "employees" ? "Employees" : importType === "milestones" ? "Milestones" : importType === "tasks" ? "Tasks" : importType === "subtasks" ? "SubTasks" : "Projects";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a valid CSV file");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setStatusMessage(`Reading ${importLabel} file...`);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        const totalRows = data.length;
        const batchSize = 50;
        let processedCount = 0;
        let insertedCount = 0;
        let updatedCount = 0;
        let successfulBatches = 0;

        try {
          for (let i = 0; i < totalRows; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            const remaining = totalRows - processedCount;

            const currentProgress = Math.min(Math.round((processedCount / totalRows) * 100), 99);
            setProgress(currentProgress);
            setStatusMessage(`Processing... ${remaining} records remaining`);

            const response = await fetch("/api/admin/imports", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: importType, data: batch }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Batch ${successfulBatches + 1} failed`);
            }

            const result = await response.json();
            insertedCount += result.inserted || 0;
            updatedCount += result.updated || 0;
            processedCount += batch.length;
            successfulBatches++;
          }

          setProgress(100);
          setStatusMessage("Import complete!");
          toast.success(`Processed ${totalRows} records. Added: ${insertedCount}, Updated: ${updatedCount}`);

          setTimeout(() => {
            setIsUploading(false);
            setProgress(0);
            setStatusMessage("");
            if (fileInputRef.current) fileInputRef.current.value = "";
          }, 1500);

        } catch (error: any) {
          console.error("Import error:", error);
          toast.error(error.message || "Failed to import data");
          setIsUploading(false);
        }
      },
      error: (error) => {
        console.error("PapaParse error:", error);
        toast.error("Failed to parse CSV file");
        setIsUploading(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Workspaces Import */}
        <Button
          variant="outline"
          className={cn(
            "flex h-40 flex-col items-center justify-center gap-4 transition-all hover:bg-accent hover:text-accent-foreground border-dashed border-2",
            isUploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => handleImportClick("workspaces")}
          disabled={isUploading}
        >
          <div className="p-3 rounded-full bg-primary/10">
            <FolderKanban className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <span className="font-semibold text-lg">Workspaces</span>
            <p className="text-xs text-muted-foreground mt-1">Import or update workspaces from CSV</p>
          </div>
        </Button>

        {/* Employees Import */}
        <Button
          variant="outline"
          className={cn(
            "flex h-40 flex-col items-center justify-center gap-4 transition-all hover:bg-accent hover:text-accent-foreground border-dashed border-2",
            isUploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => handleImportClick("employees")}
          disabled={isUploading}
        >
          <div className="p-3 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20">
            <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-center">
            <span className="font-semibold text-lg">Employees</span>
            <p className="text-xs text-muted-foreground mt-1">Import or update employees from CSV</p>
          </div>
        </Button>

        {/* Projects Import */}
        <Button
          variant="outline"
          className={cn(
            "flex h-40 flex-col items-center justify-center gap-4 transition-all hover:bg-accent hover:text-accent-foreground border-dashed border-2",
            isUploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => handleImportClick("projects")}
          disabled={isUploading}
        >
          <div className="p-3 rounded-full bg-blue-500/10 dark:bg-blue-500/20">
            <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-center">
            <span className="font-semibold text-lg">Projects</span>
            <p className="text-xs text-muted-foreground mt-1">Import or update projects from CSV</p>
          </div>
        </Button>

        {/* Milestones Import */}
        <Button
          variant="outline"
          className={cn(
            "flex h-40 flex-col items-center justify-center gap-4 transition-all hover:bg-accent hover:text-accent-foreground border-dashed border-2",
            isUploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => handleImportClick("milestones")}
          disabled={isUploading}
        >
          <div className="p-3 rounded-full bg-amber-500/10 dark:bg-amber-500/20">
            <Flag className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-center">
            <span className="font-semibold text-lg">Milestones</span>
            <p className="text-xs text-muted-foreground mt-1">Import or update milestones from CSV</p>
          </div>
        </Button>

        {/* Tasks Import */}
        <Button
          variant="outline"
          className={cn(
            "flex h-40 flex-col items-center justify-center gap-4 transition-all hover:bg-accent hover:text-accent-foreground border-dashed border-2",
            isUploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => handleImportClick("tasks")}
          disabled={isUploading}
        >
          <div className="p-3 rounded-full bg-violet-500/10 dark:bg-violet-500/20">
            <CheckSquare className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="text-center">
            <span className="font-semibold text-lg">Tasks</span>
            <p className="text-xs text-muted-foreground mt-1">Import or update tasks from CSV</p>
          </div>
        </Button>

        {/* SubTasks Import */}
        <Button
          variant="outline"
          className={cn(
            "flex h-40 flex-col items-center justify-center gap-4 transition-all hover:bg-accent hover:text-accent-foreground border-dashed border-2",
            isUploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => handleImportClick("subtasks")}
          disabled={isUploading}
        >
          <div className="p-3 rounded-full bg-teal-500/10 dark:bg-teal-500/20">
            <ListChecks className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-center">
            <span className="font-semibold text-lg">SubTasks</span>
            <p className="text-xs text-muted-foreground mt-1">Import or update subtasks from CSV</p>
          </div>
        </Button>
      </div>

      {/* Upload Progress Dialog */}
      <Dialog open={isUploading} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Importing {importLabel}</DialogTitle>
            <DialogDescription>
              Please wait while we process your file. Do not close this window.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 w-full transition-all duration-500" />
            </div>

            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium animate-pulse">
                {statusMessage}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
