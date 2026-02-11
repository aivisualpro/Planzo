"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Card, CardContent, CardDescription,
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
  LayoutGrid, GanttChart, ChevronRight, ChevronDown, Minus,
  Diamond, ListChecks, Circle,
} from "lucide-react";
import { useHeaderActions } from "@/components/providers/header-actions-provider";

// ── STATUS COLORS ─────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; fill: string; gantt: string }> = {
  "Not Started": { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", dot: "bg-slate-400", fill: "#94a3b8", gantt: "#94a3b8" },
  "In Progress": { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500", fill: "#3b82f6", gantt: "#3b82f6" },
  "For Review": { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500", fill: "#f59e0b", gantt: "#f59e0b" },
  "Blocked": { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", dot: "bg-red-500", fill: "#ef4444", gantt: "#ef4444" },
  "Completed": { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", fill: "#22c55e", gantt: "#22c55e" },
};

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
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

// ── PROJECT CARD ──────────────────────────────────────────────────
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

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>

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

// ═══════════════════════════════════════════════════════════════════
// ██  GANTT CHART VIEW  ██
// ═══════════════════════════════════════════════════════════════════

interface GanttRow {
  id: string;
  name: string;
  type: "project" | "milestone" | "task" | "subtask";
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  projectId?: string;
  milestoneId?: string;
  taskId?: string;
  assignee?: string;
  priority?: string;
  depth: number;
  parentId?: string;
  children?: GanttRow[];
  isExpanded?: boolean;
  color?: string;
}

const DAY_WIDTH = 32;
const ROW_HEIGHT = 36;
const LABEL_WIDTH = 320;

function GanttView({ nameMap }: { nameMap: Record<string, string> }) {
  const [ganttData, setGanttData] = useState<GanttRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const wsId = localStorage.getItem("planzo_active_workspace") || "";
        const params = wsId && wsId !== "all" ? `?workspaceId=${wsId}` : "";
        const res = await fetch(`/api/projects/gantt${params}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        buildGanttData(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const buildGanttData = (data: any) => {
    const rows: GanttRow[] = [];
    const { projects, tasks, milestones, subtasks } = data;

    const tasksByProject: Record<string, any[]> = {};
    const tasksByMilestone: Record<string, any[]> = {};
    const subtasksByTask: Record<string, any[]> = {};
    const milestonesByProject: Record<string, any[]> = {};

    tasks.forEach((t: any) => {
      if (t.projectId) {
        if (!tasksByProject[t.projectId]) tasksByProject[t.projectId] = [];
        tasksByProject[t.projectId].push(t);
        if (t.milestoneId) {
          if (!tasksByMilestone[t.milestoneId]) tasksByMilestone[t.milestoneId] = [];
          tasksByMilestone[t.milestoneId].push(t);
        }
      }
    });

    subtasks.forEach((st: any) => {
      if (!subtasksByTask[st.taskId]) subtasksByTask[st.taskId] = [];
      subtasksByTask[st.taskId].push(st);
    });

    milestones.forEach((m: any) => {
      if (m.projectId) {
        if (!milestonesByProject[m.projectId]) milestonesByProject[m.projectId] = [];
        milestonesByProject[m.projectId].push(m);
      }
    });

    projects.forEach((project: any) => {
      const projectRow: GanttRow = {
        id: project.projectId,
        name: project.projectName,
        type: "project",
        status: project.status || "Not Started",
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
        progress: project.progress || 0,
        depth: 0,
        color: project.color || "#3b82f6",
      };
      rows.push(projectRow);

      // Add milestones
      const pMilestones = milestonesByProject[project.projectId] || [];
      pMilestones.forEach((ms: any) => {
        rows.push({
          id: ms.milestoneId,
          name: ms.milestoneName,
          type: "milestone",
          status: ms.status || "Not Started",
          startDate: ms.dueDate ? new Date(ms.dueDate) : null,
          endDate: ms.dueDate ? new Date(ms.dueDate) : null,
          progress: ms.progress || 0,
          projectId: project.projectId,
          depth: 1,
          parentId: project.projectId,
        });

        // Tasks under this milestone
        const msTasks = tasksByMilestone[ms.milestoneId] || [];
        msTasks.forEach((task: any) => {
          rows.push({
            id: task.taskId,
            name: task.taskName,
            type: "task",
            status: task.status || "Not Started",
            startDate: task.startDate ? new Date(task.startDate) : null,
            endDate: task.dueDate ? new Date(task.dueDate) : null,
            progress: task.progress || 0,
            projectId: project.projectId,
            milestoneId: ms.milestoneId,
            assignee: task.assignee,
            priority: task.priority,
            depth: 2,
            parentId: ms.milestoneId,
          });

          // Subtasks
          const tSubtasks = subtasksByTask[task.taskId] || [];
          tSubtasks.forEach((st: any) => {
            rows.push({
              id: st.subtaskId,
              name: st.subTask,
              type: "subtask",
              status: st.status || "Not Started",
              startDate: st.createdDate ? new Date(st.createdDate) : null,
              endDate: st.completionDate ? new Date(st.completionDate) : (st.createdDate ? new Date(st.createdDate) : null),
              progress: st.status === "Completed" ? 100 : 0,
              taskId: task.taskId,
              depth: 3,
              parentId: task.taskId,
            });
          });
        });
      });

      // Tasks without milestone
      const nonMsTasks = (tasksByProject[project.projectId] || []).filter(
        (t: any) => !t.milestoneId
      );
      nonMsTasks.forEach((task: any) => {
        rows.push({
          id: task.taskId,
          name: task.taskName,
          type: "task",
          status: task.status || "Not Started",
          startDate: task.startDate ? new Date(task.startDate) : null,
          endDate: task.dueDate ? new Date(task.dueDate) : null,
          progress: task.progress || 0,
          projectId: project.projectId,
          assignee: task.assignee,
          priority: task.priority,
          depth: 1,
          parentId: project.projectId,
        });

        const tSubtasks = subtasksByTask[task.taskId] || [];
        tSubtasks.forEach((st: any) => {
          rows.push({
            id: st.subtaskId,
            name: st.subTask,
            type: "subtask",
            status: st.status || "Not Started",
            startDate: st.createdDate ? new Date(st.createdDate) : null,
            endDate: st.completionDate ? new Date(st.completionDate) : (st.createdDate ? new Date(st.createdDate) : null),
            progress: st.status === "Completed" ? 100 : 0,
            taskId: task.taskId,
            depth: 2,
            parentId: task.taskId,
          });
        });
      });
    });

    setGanttData(rows);
    // Expand all projects by default
    setExpandedIds(new Set(projects.map((p: any) => p.projectId)));
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Filter visible rows based on expansion
  const visibleRows = useMemo(() => {
    const result: GanttRow[] = [];
    const hiddenParents = new Set<string>();

    for (const row of ganttData) {
      if (row.parentId && hiddenParents.has(row.parentId)) {
        hiddenParents.add(row.id);
        continue;
      }
      if (row.parentId && !expandedIds.has(row.parentId)) {
        hiddenParents.add(row.id);
        continue;
      }
      result.push(row);
    }
    return result;
  }, [ganttData, expandedIds]);

  // Calculate date range
  const { minDate, maxDate, totalDays, months } = useMemo(() => {
    let min = new Date();
    let max = new Date();
    let hasDate = false;

    for (const row of ganttData) {
      if (row.startDate) {
        if (!hasDate || row.startDate < min) min = new Date(row.startDate);
        hasDate = true;
      }
      if (row.endDate) {
        if (!hasDate || row.endDate > max) max = new Date(row.endDate);
        hasDate = true;
      }
    }

    // Add padding
    min = new Date(min);
    min.setDate(min.getDate() - 7);
    max = new Date(max);
    max.setDate(max.getDate() + 14);

    const days = Math.max(Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)), 30);

    // Generate month headers
    const monthHeaders: { label: string; startDay: number; widthDays: number }[] = [];
    const current = new Date(min);
    current.setDate(1);

    while (current <= max) {
      const mStart = new Date(current);
      const mEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      const startDay = Math.max(0, Math.ceil((mStart.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)));
      const endDay = Math.min(days, Math.ceil((mEnd.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)));

      monthHeaders.push({
        label: current.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        startDay,
        widthDays: endDay - startDay,
      });

      current.setMonth(current.getMonth() + 1);
    }

    return { minDate: min, maxDate: max, totalDays: days, months: monthHeaders };
  }, [ganttData]);

  // Today marker position
  const todayOffset = useMemo(() => {
    const today = new Date();
    return Math.max(0, Math.ceil((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
  }, [minDate]);

  const getBarPosition = (row: GanttRow) => {
    if (!row.startDate && !row.endDate) return null;
    const start = row.startDate || row.endDate!;
    const end = row.endDate || row.startDate!;
    const startDay = Math.max(0, Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
    const endDay = Math.max(startDay + 1, Math.ceil((end.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
    return { left: startDay * DAY_WIDTH, width: Math.max((endDay - startDay) * DAY_WIDTH, DAY_WIDTH) };
  };

  const hasChildren = (id: string) => ganttData.some(r => r.parentId === id);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-8 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (ganttData.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <GanttChart className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No projects to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex border-b border-border/50 bg-muted/30">
        {/* Label header */}
        <div className="flex-shrink-0 border-r border-border/50" style={{ width: LABEL_WIDTH }}>
          <div className="h-[52px] flex items-center px-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</span>
          </div>
        </div>

        {/* Timeline header */}
        <div className="flex-1 overflow-hidden" ref={headerScrollRef}>
          <div style={{ width: totalDays * DAY_WIDTH }}>
            {/* Month row */}
            <div className="flex h-[26px]">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 border-r border-border/30 flex items-center px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                  style={{ width: m.widthDays * DAY_WIDTH, marginLeft: i === 0 ? m.startDay * DAY_WIDTH : 0 }}
                >
                  {m.label}
                </div>
              ))}
            </div>
            {/* Day ticks */}
            <div className="flex h-[26px] relative">
              {Array.from({ length: totalDays }).map((_, i) => {
                const d = new Date(minDate);
                d.setDate(d.getDate() + i);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const isToday = i === todayOffset;
                const showLabel = d.getDate() === 1 || d.getDate() === 15 || i === 0;
                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 flex items-center justify-center text-[9px] border-r ${
                      isToday ? "bg-blue-500/10 border-blue-500/30 font-bold text-blue-600 dark:text-blue-400" :
                      isWeekend ? "bg-muted/40 border-border/20 text-muted-foreground/50" :
                      "border-border/20 text-muted-foreground/60"
                    }`}
                    style={{ width: DAY_WIDTH }}
                  >
                    {showLabel ? d.getDate() : ""}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────── */}
      <div className="flex" style={{ maxHeight: "calc(100vh - 200px)" }}>
        {/* Label column */}
        <div className="flex-shrink-0 border-r border-border/50 overflow-y-auto" style={{ width: LABEL_WIDTH, maxHeight: "calc(100vh - 200px)" }}
          onScroll={(e) => {
            // sync vertical scroll with chart
            const chart = document.getElementById("gantt-chart-body");
            if (chart) chart.scrollTop = e.currentTarget.scrollTop;
          }}
        >
          {visibleRows.map((row) => {
            const sc = STATUS_COLORS[row.status] || STATUS_COLORS["Not Started"];
            const hasKids = hasChildren(row.id);
            const isExpanded = expandedIds.has(row.id);

            return (
              <div
                key={row.id}
                className={`flex items-center gap-2 border-b border-border/20 hover:bg-muted/40 transition-colors cursor-default group ${
                  row.type === "project" ? "bg-muted/20 font-semibold" : ""
                }`}
                style={{ height: ROW_HEIGHT, paddingLeft: 12 + row.depth * 20 }}
              >
                {/* Expand/Collapse toggle */}
                {hasKids ? (
                  <button
                    onClick={() => toggleExpand(row.id)}
                    className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted shrink-0"
                  >
                    {isExpanded
                      ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      : <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    }
                  </button>
                ) : (
                  <span className="w-4 shrink-0" />
                )}

                {/* Type icon */}
                {row.type === "project" && (
                  <FolderKanban className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                )}
                {row.type === "milestone" && (
                  <Diamond className="h-3 w-3 text-amber-500 shrink-0" />
                )}
                {row.type === "task" && (
                  <ListChecks className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                {row.type === "subtask" && (
                  <Circle className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
                )}

                {/* Name */}
                <span className={`truncate text-xs flex-1 ${
                  row.type === "project" ? "text-foreground" :
                  row.type === "milestone" ? "text-amber-700 dark:text-amber-400 font-medium" :
                  row.type === "subtask" ? "text-muted-foreground" :
                  "text-foreground/80"
                }`}>
                  {row.name}
                </span>

                {/* Status dot */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`h-2 w-2 rounded-full shrink-0 mr-3 ${sc.dot}`} />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">{row.status}</TooltipContent>
                </Tooltip>
              </div>
            );
          })}
        </div>

        {/* Chart area */}
        <div
          id="gantt-chart-body"
          className="flex-1 overflow-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
          onScroll={handleScroll}
        >
          <div style={{ width: totalDays * DAY_WIDTH, position: "relative" }}>
            {/* Weekend stripes */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const d = new Date(minDate);
              d.setDate(d.getDate() + i);
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              if (!isWeekend) return null;
              return (
                <div
                  key={`bg-${i}`}
                  className="absolute top-0 bg-muted/25"
                  style={{
                    left: i * DAY_WIDTH,
                    width: DAY_WIDTH,
                    height: visibleRows.length * ROW_HEIGHT,
                  }}
                />
              );
            })}

            {/* Today line */}
            <div
              className="absolute top-0 z-20 pointer-events-none"
              style={{
                left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2,
                height: visibleRows.length * ROW_HEIGHT,
              }}
            >
              <div className="w-px h-full bg-blue-500/60" />
              <div
                className="absolute -top-0 -left-[10px] w-[21px] h-[8px] rounded-b-full"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
              />
            </div>

            {/* Bars */}
            {visibleRows.map((row, rowIndex) => {
              const pos = getBarPosition(row);
              if (!pos) {
                return (
                  <div key={row.id} style={{ height: ROW_HEIGHT }} />
                );
              }

              const barColor = row.type === "project"
                ? (row.color || "#3b82f6")
                : row.type === "milestone"
                ? "#f59e0b"
                : row.priority
                ? (PRIORITY_COLORS[row.priority] || STATUS_COLORS[row.status]?.gantt || "#94a3b8")
                : (STATUS_COLORS[row.status]?.gantt || "#94a3b8");

              return (
                <div key={row.id} className="relative" style={{ height: ROW_HEIGHT }}>
                  {row.type === "milestone" ? (
                    /* Milestone diamond */
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute flex items-center justify-center"
                          style={{
                            left: pos.left + pos.width / 2 - 8,
                            top: ROW_HEIGHT / 2 - 8,
                            width: 16,
                            height: 16,
                          }}
                        >
                          <div
                            className="w-3 h-3 rotate-45 shadow-sm"
                            style={{ backgroundColor: barColor }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        <div className="font-medium">{row.name}</div>
                        {row.endDate && (
                          <div className="text-muted-foreground">
                            {row.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ) : row.type === "project" ? (
                    /* Project summary bar */
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute flex items-center"
                          style={{
                            left: pos.left,
                            top: ROW_HEIGHT / 2 - 5,
                            width: pos.width,
                            height: 10,
                          }}
                        >
                          <div
                            className="w-full h-full rounded-full relative overflow-hidden"
                            style={{ backgroundColor: barColor + "30" }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${row.progress || 0}%`,
                                background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                              }}
                            />
                          </div>
                          {/* End caps */}
                          <div
                            className="absolute left-0 top-0 w-1 h-full rounded-l-full"
                            style={{ backgroundColor: barColor }}
                          />
                          <div
                            className="absolute right-0 top-0 w-1 h-full rounded-r-full"
                            style={{ backgroundColor: barColor }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-muted-foreground">Progress: {row.progress || 0}%</div>
                        {row.startDate && row.endDate && (
                          <div className="text-muted-foreground">
                            {row.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} → {row.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    /* Task / Subtask bar */
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute group/bar"
                          style={{
                            left: pos.left,
                            top: row.type === "subtask" ? ROW_HEIGHT / 2 - 4 : ROW_HEIGHT / 2 - 6,
                            width: pos.width,
                            height: row.type === "subtask" ? 8 : 12,
                          }}
                        >
                          <div
                            className="w-full h-full rounded relative overflow-hidden transition-shadow group-hover/bar:shadow-md"
                            style={{ backgroundColor: barColor + "25" }}
                          >
                            <div
                              className="h-full rounded transition-all duration-500"
                              style={{
                                width: `${Math.max(row.progress || 0, 2)}%`,
                                background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)`,
                              }}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        <div className="font-medium">{row.name}</div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{row.status}</span>
                          {row.progress > 0 && <span>• {row.progress}%</span>}
                        </div>
                        {row.assignee && (
                          <div className="text-muted-foreground">
                            {nameMap[row.assignee] || row.assignee}
                          </div>
                        )}
                        {row.startDate && row.endDate && (
                          <div className="text-muted-foreground">
                            {row.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} → {row.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ██  PROJECTS PAGE  ██
// ═══════════════════════════════════════════════════════════════════
export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"card" | "gantt">("card");
  const { setLeftContent, setRightContent } = useHeaderActions();

  // Load employee name map
  useEffect(() => {
    fetch("/api/employees/lookup")
      .then(r => r.json())
      .then(d => setNameMap(d.map || {}))
      .catch(console.error);
  }, []);

  const [wsVersion, setWsVersion] = useState(0);
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

  // ── Inject header content ──────────────────────────
  useEffect(() => {
    setLeftContent(
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Projects
        </h1>
        {!loading && (
          <Badge variant="secondary" className="text-xs font-medium rounded-full px-2.5 py-0.5">
            {projects.length}
          </Badge>
        )}
      </div>
    );

    setRightContent(
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 w-48 text-sm"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Card
          </Button>
          <Button
            variant={viewMode === "gantt" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => setViewMode("gantt")}
          >
            <GanttChart className="h-3.5 w-3.5" />
            Gantt
          </Button>
        </div>
      </div>
    );

    return () => {
      setLeftContent(null);
      setRightContent(null);
    };
  }, [loading, projects.length, search, viewMode]);

  // Sync search changes to header
  useEffect(() => {
    setRightContent(
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 w-48 text-sm"
          />
        </div>
        <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Card
          </Button>
          <Button
            variant={viewMode === "gantt" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => setViewMode("gantt")}
          >
            <GanttChart className="h-3.5 w-3.5" />
            Gantt
          </Button>
        </div>
      </div>
    );
  }, [search, viewMode]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {viewMode === "card" ? (
          <>
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
          </>
        ) : (
          <GanttView nameMap={nameMap} />
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
