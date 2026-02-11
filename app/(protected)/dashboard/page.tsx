"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  FolderKanban,
  ListChecks,
  Target,
  ShieldAlert,
  Timer,
  Star,
  ArrowUpRight,
  CalendarDays,
  Activity,
  Ban,
  Flag,
} from "lucide-react";

// ── Status color palette ──────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  "Not Started": "#94a3b8",
  "In Progress": "#3b82f6",
  "For Review": "#f59e0b",
  "Blocked": "#ef4444",
  "Completed": "#22c55e",
  "completed": "#22c55e",
};

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8", "#8b5cf6"];

// ── KPI Card Component ────────────────────────────────────────────
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "primary",
  loading = false,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: any;
  trend?: { value: number; label: string };
  color?: string;
  loading?: boolean;
}) {
  const colorMap: Record<string, string> = {
    primary: "from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10",
    green: "from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10",
    amber: "from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10",
    red: "from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10",
    purple: "from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10",
    cyan: "from-cyan-500/10 to-cyan-600/5 dark:from-cyan-500/20 dark:to-cyan-600/10",
  };

  const iconColorMap: Record<string, string> = {
    primary: "text-blue-600 dark:text-blue-400",
    green: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    purple: "text-purple-600 dark:text-purple-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`h-3 w-3 ${trend.value >= 0 ? "text-emerald-500" : "text-red-500"}`} />
                <span className={`text-xs font-medium ${trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {trend.value >= 0 ? "+" : ""}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-xl bg-background/80 shadow-sm`}>
            <Icon className={`h-5 w-5 ${iconColorMap[color]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Status Badge Component ────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    "Not Started": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    "For Review": "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    "Blocked": "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    "Completed": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[status] || colorMap["Not Started"]}`}>
      {status}
    </span>
  );
}

// ── Activity Item Component ───────────────────────────────────────
function ActivityItem({ activity, nameMap = {} }: { activity: any; nameMap?: Record<string, string> }) {
  const typeIcons: Record<string, any> = {
    comment: Activity,
    note: Activity,
    status_change: ArrowUpRight,
    assignment: Users,
    approval: CheckCircle2,
    blocker: Ban,
  };

  const Icon = typeIcons[activity.type] || Activity;
  const time = activity.createdAt
    ? new Date(activity.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const authorDisplay = activity.authorName || nameMap[activity.author] || activity.author;

  return (
    <div className="flex gap-3 py-3 border-b border-border/50 last:border-0 group/item">
      <div className="flex-shrink-0 mt-0.5">
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
          <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover/item:text-primary transition-colors" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-medium">{authorDisplay}</span>
          {" "}
          <span className="text-muted-foreground">{activity.action}</span>
        </p>
        {activity.content && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.content}</p>
        )}
        <p className="text-[10px] text-muted-foreground/70 mt-1">{time}</p>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  // Fetch dashboard data — workspace comes from sidebar via localStorage
  useEffect(() => {
    setLoading(true);
    const workspaceId = localStorage.getItem("planzo_active_workspace") || "";
    const params = workspaceId && workspaceId !== "all" ? `?workspaceId=${workspaceId}` : "";
    fetch(`/api/dashboard${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [wsVersion]);

  // ── Chart data preparation ────────────────────────────────────
  const taskStatusData = data?.taskStatusBreakdown
    ? Object.entries(data.taskStatusBreakdown).map(([name, value]) => ({
        name: name || "Unknown",
        value: value as number,
        fill: STATUS_COLORS[name] || "#94a3b8",
      }))
    : [];

  const projectStatusData = data?.projectStatusBreakdown
    ? Object.entries(data.projectStatusBreakdown).map(([name, value]) => ({
        name: name || "Unknown",
        value: value as number,
      }))
    : [];

  const overdueData = data?.overdueSeverity
    ? [
        { name: "1-3 days", count: data.overdueSeverity["1-3 days"] || 0, fill: "#f59e0b" },
        { name: "4-7 days", count: data.overdueSeverity["4-7 days"] || 0, fill: "#f97316" },
        { name: ">7 days", count: data.overdueSeverity[">7 days"] || 0, fill: "#ef4444" },
      ]
    : [];

  // ── Greeting ──────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ── Greeting sub-header ─────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{today}</p>
          <p className="text-lg font-medium">{greeting}! Here&apos;s your overview.</p>
        </div>

        {/* ── KPI Cards Row 1 ──────────────────────────────────────── */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Active Projects"
            value={data?.summary?.totalProjects || 0}
            subtitle="Across all workspaces"
            icon={FolderKanban}
            color="primary"
            loading={loading}
          />
          <KPICard
            title="Total Tasks"
            value={data?.summary?.totalTasks || 0}
            subtitle={`${data?.summary?.completedTasks || 0} completed`}
            icon={ListChecks}
            color="purple"
            loading={loading}
          />
          <KPICard
            title="Team Members"
            value={data?.summary?.totalMembers || 0}
            subtitle="Active contributors"
            icon={Users}
            color="cyan"
            loading={loading}
          />
          <KPICard
            title="Completion Rate"
            value={`${data?.summary?.completionRate || 0}%`}
            subtitle={`${data?.summary?.onTimeRate || 0}% on time`}
            icon={Target}
            color="green"
            loading={loading}
          />
        </div>

        {/* ── KPI Cards Row 2 (Weekly Metrics) ─────────────────────── */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <KPICard
            title="Completed (Week)"
            value={data?.weeklyMetrics?.completedThisWeek || 0}
            subtitle="Tasks this week"
            icon={CheckCircle2}
            color="green"
            loading={loading}
          />
          <KPICard
            title="Overdue Tasks"
            value={data?.summary?.overdueTasks || 0}
            subtitle="Past due date"
            icon={AlertTriangle}
            color="red"
            loading={loading}
          />
          <KPICard
            title="Blocked Tasks"
            value={data?.summary?.blockedTasks || 0}
            subtitle="Need attention"
            icon={Ban}
            color="amber"
            loading={loading}
          />
          <KPICard
            title="Pending Approvals"
            value={data?.summary?.pendingApprovals || 0}
            subtitle="Awaiting review"
            icon={ShieldAlert}
            color="purple"
            loading={loading}
          />
          <KPICard
            title="Time Logged"
            value={`${data?.weeklyMetrics?.timeLoggedHours || 0}h`}
            subtitle="This week"
            icon={Timer}
            color="cyan"
            loading={loading}
          />
        </div>

        {/* ── Charts Row ───────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Task Status Breakdown */}
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Task Status</CardTitle>
              <CardDescription className="text-xs">Distribution across all tasks</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[220px]">
                  <Skeleton className="h-40 w-40 rounded-full" />
                </div>
              ) : taskStatusData.length > 0 ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span className="text-xs text-foreground">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                  No tasks yet
                </div>
              )}
              {/* Status breakdown list */}
              {!loading && taskStatusData.length > 0 && (
                <div className="space-y-2 mt-2">
                  {taskStatusData.map((s) => (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: s.fill }}
                        />
                        <span className="text-muted-foreground text-xs">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{s.value}</span>
                        <span className="text-muted-foreground text-[10px]">
                          ({data?.summary?.totalTasks
                            ? Math.round((s.value / data.summary.totalTasks) * 100)
                            : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Severity */}
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Overdue Breakdown</CardTitle>
              <CardDescription className="text-xs">Tasks past due date by severity</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4 h-[220px] flex flex-col justify-center">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                </div>
              ) : (
                <>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overdueData} layout="vertical" barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 11 }}
                          width={60}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                          {overdueData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Summary */}
                  <div className="flex items-center justify-between mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">
                        Total Overdue
                      </span>
                    </div>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      {data?.summary?.overdueTasks || 0}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Project Status */}
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Project Status</CardTitle>
              <CardDescription className="text-xs">Status distribution across projects</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : projectStatusData.length > 0 ? (
                <div className="space-y-4">
                  {projectStatusData.map((s, i) => {
                    const total = data?.summary?.totalProjects || 1;
                    const pct = Math.round((s.value / total) * 100);
                    return (
                      <div key={s.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={s.name} />
                          </div>
                          <span className="text-sm font-semibold">{s.value}/{total}</span>
                        </div>
                        <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {/* Overall progress */}
                  <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 border border-blue-200/50 dark:border-blue-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Overall Progress</span>
                      <span className="text-lg font-bold">{data?.summary?.completionRate || 0}%</span>
                    </div>
                    <Progress value={data?.summary?.completionRate || 0} className="h-2" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                  No projects yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom Row ───────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Upcoming Milestones */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Flag className="h-4 w-4 text-amber-500" />
                  Upcoming Milestones
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : data?.upcomingMilestones?.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingMilestones.map((ms: any, i: number) => {
                    const dueDate = ms.dueDate
                      ? new Date(ms.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "No date";
                    const daysUntil = ms.dueDate
                      ? Math.ceil(
                          (new Date(ms.dueDate).getTime() - Date.now()) / 86400000
                        )
                      : null;

                    return (
                      <div
                        key={ms.milestoneId || i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer group"
                      >
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                          <Flag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {ms.milestoneName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <CalendarDays className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{dueDate}</span>
                            {daysUntil !== null && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                {daysUntil > 0 ? `${daysUntil}d left` : "Today"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Flag className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming milestones</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quality Score */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Quality & Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  {/* Score circle */}
                  <div className="relative h-28 w-28 mb-4">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={
                          (data?.summary?.avgScore || 0) >= 4
                            ? "#22c55e"
                            : (data?.summary?.avgScore || 0) >= 3
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${((data?.summary?.avgScore || 0) / 5) * 264} 264`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">
                        {data?.summary?.avgScore || "—"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">/5.0</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium">Average Manager Score</p>
                  <p className="text-xs text-muted-foreground mt-0.5">On completed tasks</p>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 mt-6 w-full">
                    <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {data?.summary?.onTimeRate || 0}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">On-Time Rate</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {data?.summary?.completionRate || 0}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">Completion Rate</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[380px] overflow-auto">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3 py-2">
                      <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : data?.recentActivity?.length > 0 ? (
                <div>
                  {data.recentActivity.map((act: any, i: number) => (
                    <ActivityItem key={act.activityId || i} activity={act} nameMap={nameMap} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Activities will appear here as your team works
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
