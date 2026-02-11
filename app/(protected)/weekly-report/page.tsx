"use client";

import React, { useState, useEffect } from "react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronLeft, ChevronRight, Download, Users, CheckCircle2,
  Clock, AlertTriangle, Star, Timer, Ban, ArrowUpRight,
  TrendingUp, Target,
} from "lucide-react";

// ── Member Report Card ────────────────────────────────────────────
function MemberReportCard({ member: m, expanded, onToggle, nameMap = {} }: {
  member: any; expanded: boolean; onToggle: () => void; nameMap?: Record<string, string>;
}) {
  const displayName = nameMap[m.member] || m.member;
  const scoreColor = (m.qualityScore || 0) >= 4 ? "text-emerald-600 dark:text-emerald-400"
    : (m.qualityScore || 0) >= 3 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow group">
      <CardContent className="p-0">
        {/* Header row */}
        <div
          onClick={onToggle}
          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/20 transition-colors rounded-t-lg"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">
              {m.member?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">{displayName}</h3>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {m.completedThisWeek} done
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                {m.overdueTasks} overdue
              </span>
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3 text-blue-500" />
                {m.hoursLogged}h
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {m.qualityScore !== null && (
              <div className="text-center">
                <span className={`text-lg font-bold ${scoreColor}`}>{m.qualityScore}</span>
                <p className="text-[9px] text-muted-foreground">/5.0</p>
              </div>
            )}
            <Badge variant={m.onTimeRate >= 80 ? "default" : m.onTimeRate >= 50 ? "secondary" : "destructive"} className="text-[10px]">
              {m.onTimeRate}% on-time
            </Badge>
            <ArrowUpRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="px-4 pb-4 pt-0 border-t space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
              <StatTile label="Completed" value={m.completedThisWeek} icon={CheckCircle2} iconColor="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-950/30" />
              <StatTile label="Total Assigned" value={m.assignedAsOfWeek} icon={Target} iconColor="text-blue-500" bg="bg-blue-50 dark:bg-blue-950/30" />
              <StatTile label="Hours Logged" value={`${m.hoursLogged}h`} icon={Timer} iconColor="text-purple-500" bg="bg-purple-50 dark:bg-purple-950/30" />
              <StatTile label="Utilisation" value={`${m.utilisationPct}%`} icon={TrendingUp} iconColor="text-cyan-500" bg="bg-cyan-50 dark:bg-cyan-950/30" />
              <StatTile label="Overdue" value={m.overdueTasks} icon={AlertTriangle} iconColor="text-red-500" bg="bg-red-50 dark:bg-red-950/30" />
              <StatTile label="Blocked" value={m.blockedTasks} icon={Ban} iconColor="text-amber-500" bg="bg-amber-50 dark:bg-amber-950/30" />
            </div>

            {/* Utilization bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Utilization ({m.hoursLogged}h / 40h)</span>
                <span className={`font-semibold ${m.utilisationPct > 100 ? "text-red-500" : m.utilisationPct >= 80 ? "text-emerald-500" : "text-amber-500"}`}>
                  {m.utilisationPct}%
                </span>
              </div>
              <Progress value={Math.min(m.utilisationPct, 100)} className="h-2" />
            </div>

            {/* Upcoming tasks */}
            {m.upcomingTasks?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                  Upcoming Tasks ({m.upcomingTasks.length})
                </h4>
                <div className="space-y-1.5">
                  {m.upcomingTasks.map((t: any, i: number) => (
                    <div key={t.taskId || i} className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        t.status === "In Progress" ? "bg-blue-500" : t.isBlocked ? "bg-red-500" : "bg-slate-400"
                      }`} />
                      <span className="text-xs flex-1 truncate">{t.taskName}</span>
                      {t.isBlocked && <Ban className="h-3 w-3 text-red-500" />}
                      {t.dueDate && (
                        <span className={`text-[10px] ${new Date(t.dueDate) < new Date() ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                          {new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({ label, value, icon: Icon, iconColor, bg }: {
  label: string; value: number | string; icon: any; iconColor: string; bg: string;
}) {
  return (
    <div className={`p-2.5 rounded-lg ${bg} text-center`}>
      <Icon className={`h-4 w-4 mx-auto ${iconColor} mb-1`} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
export default function WeeklyReportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
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
    const params = new URLSearchParams();
    params.set("weekOffset", weekOffset.toString());
    const wsId = localStorage.getItem("planzo_active_workspace") || "";
    if (wsId && wsId !== "all") params.set("workspaceId", wsId);
    fetch(`/api/weekly-report?${params.toString()}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [weekOffset, wsVersion]);

  const weekLabel = data ? (() => {
    const start = new Date(data.weekStart);
    const end = new Date(data.weekEnd);
    end.setDate(end.getDate() - 1);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  })() : "";

  const totals = data?.members?.reduce((acc: any, m: any) => ({
    completed: acc.completed + (m.completedThisWeek || 0),
    overdue: acc.overdue + (m.overdueTasks || 0),
    hours: acc.hours + (m.hoursLogged || 0),
    blocked: acc.blocked + (m.blockedTasks || 0),
  }), { completed: 0, overdue: 0, hours: 0, blocked: 0 }) || { completed: 0, overdue: 0, hours: 0, blocked: 0 };

  const handleExport = () => {
    if (!data?.members?.length) return;
    const headers = ["Member", "Completed", "Assigned", "On-Time %", "Hours Logged", "Utilisation %", "Overdue", "Blocked", "Quality Score"];
    const rows = data.members.map((m: any) => [
      nameMap[m.member] || m.member, m.completedThisWeek, m.assignedAsOfWeek, m.onTimeRate,
      m.hoursLogged, m.utilisationPct, m.overdueTasks, m.blockedTasks, m.qualityScore || "—",
    ]);
    const csv = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-report-${weekLabel.replace(/\s/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Per-member performance metrics</p>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5" disabled={!data?.members?.length}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>

        {/* Week Navigator */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(weekOffset - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="text-sm font-semibold">{weekLabel || "Loading..."}</p>
                <p className="text-[10px] text-muted-foreground">
                  {weekOffset === 0 ? "Current Week" : weekOffset === -1 ? "Last Week" : `${Math.abs(weekOffset)} weeks ${weekOffset < 0 ? "ago" : "ahead"}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(weekOffset + 1)} disabled={weekOffset >= 0}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary KPIs */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Tasks Completed", value: totals.completed, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Hours Logged", value: `${Math.round(totals.hours * 10) / 10}h`, color: "text-blue-600 dark:text-blue-400" },
            { label: "Overdue Tasks", value: totals.overdue, color: "text-red-600 dark:text-red-400" },
            { label: "Blocked Tasks", value: totals.blocked, color: "text-amber-600 dark:text-amber-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
                  <>
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Member Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.members?.length > 0 ? (
          <div className="space-y-3">
            {data.members.map((m: any) => (
              <MemberReportCard
                key={m.member}
                member={m}
                expanded={expandedMember === m.member}
                onToggle={() => setExpandedMember(expandedMember === m.member ? null : m.member)}
                nameMap={nameMap}
              />
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No member data for this week</p>
              <p className="text-xs text-muted-foreground mt-0.5">Assign tasks to team members to see reports</p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
