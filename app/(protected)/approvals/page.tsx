"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, CheckCircle2, XCircle, Clock, AlertTriangle,
  Flag, User, CalendarDays, MessageSquare, Star,
} from "lucide-react";
import { toast } from "sonner";

const APPROVAL_TABS = [
  { value: "pending", label: "Pending", icon: Clock },
  { value: "approved", label: "Approved", icon: CheckCircle2 },
  { value: "rejected", label: "Rejected", icon: XCircle },
];

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: "text-red-600 dark:text-red-400",
  High: "text-orange-600 dark:text-orange-400",
  Normal: "text-blue-600 dark:text-blue-400",
  Low: "text-slate-500 dark:text-slate-400",
};

export default function ApprovalsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [score, setScore] = useState("0");
  const [saving, setSaving] = useState(false);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  // Load employee name map
  useEffect(() => {
    fetch("/api/employees/lookup")
      .then(r => r.json())
      .then(d => setNameMap(d.map || {}))
      .catch(console.error);
  }, []);

  const [wsVersion, setWsVersion] = useState(0);

  // Listen for workspace changes from sidebar
  useEffect(() => {
    const handler = () => setWsVersion(v => v + 1);
    window.addEventListener("workspace-changed", handler);
    return () => window.removeEventListener("workspace-changed", handler);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("approvalStatus", activeTab);
    params.set("limit", "100");
    const wsId = localStorage.getItem("planzo_active_workspace") || "";
    if (wsId && wsId !== "all") params.set("workspaceId", wsId);
    try {
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [activeTab, wsVersion]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleApproval = async (taskId: string, action: "approved" | "rejected") => {
    setSaving(true);
    try {
      const updates: any = {
        taskId,
        approvalStatus: action,
      };
      if (action === "approved" && parseInt(score) > 0) {
        updates.managerScore = parseInt(score);
      }
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        toast.success(`Task ${action}!`);
        setReviewDialog(null);
        setReviewNotes("");
        setScore("0");
        fetchTasks();
      } else { toast.error("Failed to update"); }
    } catch { toast.error("Error updating"); }
    setSaving(false);
  };

  const pendingCount = activeTab === "pending" ? tasks.length : 0;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Review and approve completed tasks</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {APPROVAL_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Task Cards */}
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              {activeTab === "pending" ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-emerald-500/30 mb-3" />
                  <p className="text-sm text-muted-foreground">All caught up! No pending approvals.</p>
                </>
              ) : (
                <>
                  <Shield className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No {activeTab} tasks found</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map(task => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <Card key={task.taskId} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {task.taskName}
                      </h3>
                      <Badge
                        variant={activeTab === "pending" ? "secondary" : activeTab === "approved" ? "default" : "destructive"}
                        className="text-[10px] ml-2 flex-shrink-0"
                      >
                        {task.approvalStatus}
                      </Badge>
                    </div>

                    {task.taskDescription && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.taskDescription}</p>
                    )}

                    <div className="space-y-2 text-xs">
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Assignee:</span>
                          <span className="font-medium">{nameMap[task.assignee] || task.assignee}</span>
                        </div>
                      )}
                      {task.reviewer && (
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Reviewer:</span>
                          <span className="font-medium">{nameMap[task.reviewer] || task.reviewer}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          <span className={isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}>
                            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {task.priority && (
                        <div className="flex items-center gap-2">
                          <Flag className="h-3 w-3 text-muted-foreground" />
                          <span className={PRIORITY_COLORS[task.priority]}>{task.priority}</span>
                        </div>
                      )}
                      {task.managerScore && (
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span>Score: {task.managerScore}/5</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {activeTab === "pending" && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                          onClick={(e) => { e.stopPropagation(); setReviewDialog(task); }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 gap-1.5 h-8 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleApproval(task.taskId, "rejected"); }}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Review & Score Dialog */}
        <Dialog open={!!reviewDialog} onOpenChange={() => { setReviewDialog(null); setReviewNotes(""); setScore("0"); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Approve Task
              </DialogTitle>
            </DialogHeader>
            {reviewDialog && (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium">{reviewDialog.taskName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    By: {reviewDialog.assignee ? (nameMap[reviewDialog.assignee] || reviewDialog.assignee) : "Unknown"}
                  </p>
                </div>

                {/* Quality Score */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Quality Score (Optional)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        onClick={() => setScore(s.toString())}
                        className={`h-10 w-10 rounded-lg border transition-all ${
                          parseInt(score) >= s
                            ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-600 dark:text-amber-400"
                            : "bg-background border-border text-muted-foreground hover:border-amber-300"
                        }`}
                      >
                        <Star className={`h-5 w-5 mx-auto ${parseInt(score) >= s ? "fill-amber-500 text-amber-500" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Review Notes (Optional)</label>
                  <Textarea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Add any feedback or notes..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialog(null)}>Cancel</Button>
              <Button
                onClick={() => reviewDialog && handleApproval(reviewDialog.taskId, "approved")}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              >
                {saving ? "Approving..." : <><CheckCircle2 className="h-4 w-4" /> Approve</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
