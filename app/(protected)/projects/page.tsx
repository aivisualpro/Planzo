"use client";

import React, { useState, useEffect } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
} from "recharts";
import {
  Search, FolderKanban, ArrowUpRight, CheckCircle2, Clock,
  AlertTriangle, Ban, Flag, Users, CalendarDays, TrendingUp,
} from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; fill: string }> = {
  "Not Started": { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", dot: "bg-slate-400", fill: "#94a3b8" },
  "In Progress": { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500", fill: "#3b82f6" },
  "For Review": { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500", fill: "#f59e0b" },
  "Blocked": { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", dot: "bg-red-500", fill: "#ef4444" },
  "Completed": { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", fill: "#22c55e" },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["Not Started"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

// ── Project Card ──────────────────────────────────────────────────
function ProjectCard({ project, onClick, nameMap = {} }: { project: any; onClick: () => void; nameMap?: Record<string, string> }) {
  const pct = project.taskCount > 0
    ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
  const endDate = project.endDate
    ? new Date(project.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== "Completed";

  return (
    <Card
      onClick={onClick}
      className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden relative"
    >
      {/* Color strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: project.color || "#3b82f6" }}
      />
      <CardContent className="p-5 pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold group-hover:text-primary transition-colors truncate">
              {project.projectName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {project.projectId}
            </p>
          </div>
          <StatusBadge status={project.status || "Not Started"} />
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>{project.completedCount}/{project.taskCount} tasks</span>
          </div>
          {endDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : ""}`}>
              <CalendarDays className="h-3 w-3" />
              <span>{endDate}</span>
            </div>
          )}
        </div>

        {/* Members */}
        {project.members?.length > 0 && (
          <div className="flex items-center gap-0.5 mt-3 -space-x-1.5">
            {project.members.slice(0, 5).map((m: string, i: number) => {
              const name = nameMap[m] || m;
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div className="h-6 w-6 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                      <span className="text-[8px] font-bold text-primary">{name.charAt(0).toUpperCase()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">{name}</TooltipContent>
                </Tooltip>
              );
            })}
            {project.members.length > 5 && (
              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-[8px] font-medium">+{project.members.length - 5}</span>
              </div>
            )}
          </div>
        )}

        <ArrowUpRight className="absolute top-3 right-3 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
// ██  PROJECTS PAGE  ██
// ══════════════════════════════════════════════════════════════════
export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
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

  useEffect(() => {
    setLoading(true);
    const wsId = localStorage.getItem("planzo_active_workspace") || "";
    const params = wsId && wsId !== "all" ? `?workspaceId=${wsId}` : "";
    fetch(`/api/projects${params}`)
      .then(r => r.json())
      .then(d => { setProjects(d.projects || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [wsVersion]);

  // Fetch project detail
  const openProject = async (project: any) => {
    setSelectedProject(project);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/projects?projectId=${project.projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectDetail(data);
      }
    } catch (err) { console.error(err); }
    setDetailLoading(false);
  };

  const filtered = projects.filter(p =>
    !search || p.projectName?.toLowerCase().includes(search.toLowerCase()) || p.projectId?.toLowerCase().includes(search.toLowerCase())
  );

  // Chart data for project detail
  const statusData = projectDetail?.metrics?.statusBreakdown
    ? Object.entries(projectDetail.metrics.statusBreakdown).map(([name, value]) => ({
        name, value: value as number, fill: STATUS_COLORS[name]?.fill || "#94a3b8",
      }))
    : [];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{projects.length} projects</p>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </CardContent>
        </Card>

        {/* Project Grid */}
        {loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderKanban className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No projects found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(project => (
              <ProjectCard key={project.projectId} project={project} onClick={() => openProject(project)} nameMap={nameMap} />
            ))}
          </div>
        )}

        {/* ── Project Detail Dialog ───────────────────────────────── */}
        <Dialog open={!!selectedProject} onOpenChange={() => { setSelectedProject(null); setProjectDetail(null); }}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            {selectedProject && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={selectedProject.status || "Not Started"} />
                    <Badge variant="outline" className="text-[10px]">{selectedProject.projectId}</Badge>
                  </div>
                  <DialogTitle>{selectedProject.projectName}</DialogTitle>
                  {selectedProject.description && (
                    <CardDescription className="mt-1">{selectedProject.description}</CardDescription>
                  )}
                </DialogHeader>

                {detailLoading ? (
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
                    </div>
                    <Skeleton className="h-[200px]" />
                  </div>
                ) : projectDetail ? (
                  <div className="space-y-5 py-2">
                    {/* KPI row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {projectDetail.metrics.totalTasks}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Total Tasks</p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-center">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {projectDetail.metrics.taskCompletionPct}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">Completion</p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-center">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {projectDetail.metrics.overdueTasks}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Overdue</p>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-center">
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {projectDetail.metrics.blockedTasks}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Blocked</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">Task Progress</span>
                        <span>
                          {projectDetail.metrics.completedTasks}/{projectDetail.metrics.totalTasks} completed
                        </span>
                      </div>
                      <Progress value={projectDetail.metrics.taskCompletionPct} className="h-3" />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Status Donut */}
                      {statusData.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Task Breakdown</h4>
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                  {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-1.5 mt-2">
                            {statusData.map(s => (
                              <div key={s.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.fill }} />
                                  <span className="text-muted-foreground">{s.name}</span>
                                </div>
                                <span className="font-medium">{s.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Overdue severity chart */}
                      {projectDetail.metrics.overdueSeverity?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Overdue Tasks</h4>
                          <div className="space-y-2">
                            {projectDetail.metrics.overdueSeverity.map((t: any, i: number) => (
                              <div key={t.taskId || i} className="flex items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
                                <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${t.daysOverdue > 7 ? "text-red-600" : t.daysOverdue > 3 ? "text-orange-500" : "text-amber-500"}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{t.taskName}</p>
                                  <p className="text-[10px] text-muted-foreground">{nameMap[t.assignee] || t.assignee || "Unassigned"}</p>
                                </div>
                                <Badge variant="destructive" className="text-[10px]">
                                  {Math.round(t.daysOverdue)}d overdue
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Milestones */}
                    {projectDetail.milestones?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Flag className="h-4 w-4 text-amber-500" />
                          Milestones ({projectDetail.milestones.length})
                        </h4>
                        <div className="space-y-2">
                          {projectDetail.milestones.map((ms: any, i: number) => (
                            <div key={ms.milestoneId || i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                              <div className={`h-2 w-2 rounded-full ${ms.status === "Completed" ? "bg-emerald-500" : "bg-amber-500"}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{ms.milestoneName}</p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {ms.dueDate ? new Date(ms.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                              </span>
                              <StatusBadge status={ms.status || "Not Started"} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risks */}
                    {projectDetail.project?.risks?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Risks ({projectDetail.project.risks.length})
                        </h4>
                        <div className="space-y-2">
                          {projectDetail.project.risks.map((risk: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
                              <p className="text-sm">{typeof risk === "string" ? risk : risk.description || risk}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Capacity */}
                    {(projectDetail.project?.budgetHours || projectDetail.project?.actualHours) && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/30">
                        <h4 className="text-sm font-semibold mb-3">Capacity Planning</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <p className="text-xl font-bold">{projectDetail.project.budgetHours || 0}h</p>
                            <p className="text-xs text-muted-foreground">Budget Hours</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold">{projectDetail.project.actualHours || 0}h</p>
                            <p className="text-xs text-muted-foreground">Actual Hours</p>
                          </div>
                        </div>
                        {projectDetail.project.budgetHours > 0 && (
                          <div className="mt-3">
                            <Progress
                              value={Math.min((projectDetail.project.actualHours / projectDetail.project.budgetHours) * 100, 100)}
                              className="h-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-center">
                              {Math.round((projectDetail.project.actualHours / projectDetail.project.budgetHours) * 100)}% of budget used
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
