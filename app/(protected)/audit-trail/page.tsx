"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  User,
  ArrowUpRight,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  Shield,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  MessageSquare,
  Timer,
  Ban,
  Link2,
  Unlink,
  Star,
  Paperclip,
  Activity,
} from "lucide-react";

// ── Event type config ─────────────────────────────────────────────
const EVENT_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  task_created: { icon: ListChecks, color: "text-emerald-500", label: "Task Created" },
  task_updated: { icon: Pencil, color: "text-blue-500", label: "Task Updated" },
  task_deleted: { icon: Trash2, color: "text-red-500", label: "Task Deleted" },
  status_changed: { icon: ArrowUpRight, color: "text-amber-500", label: "Status Changed" },
  assignment_changed: { icon: UserPlus, color: "text-purple-500", label: "Assignment Changed" },
  approval_requested: { icon: Shield, color: "text-amber-500", label: "Approval Requested" },
  approval_completed: { icon: CheckCircle2, color: "text-emerald-500", label: "Approval Completed" },
  project_created: { icon: FileText, color: "text-blue-500", label: "Project Created" },
  project_updated: { icon: Pencil, color: "text-blue-500", label: "Project Updated" },
  project_deleted: { icon: Trash2, color: "text-red-500", label: "Project Deleted" },
  milestone_created: { icon: FileText, color: "text-cyan-500", label: "Milestone Created" },
  milestone_updated: { icon: Pencil, color: "text-cyan-500", label: "Milestone Updated" },
  comment_added: { icon: MessageSquare, color: "text-blue-400", label: "Comment Added" },
  time_logged: { icon: Timer, color: "text-green-500", label: "Time Logged" },
  blocker_flagged: { icon: Ban, color: "text-red-500", label: "Blocker Flagged" },
  blocker_resolved: { icon: CheckCircle2, color: "text-green-500", label: "Blocker Resolved" },
  dependency_added: { icon: Link2, color: "text-purple-500", label: "Dependency Added" },
  dependency_removed: { icon: Unlink, color: "text-gray-500", label: "Dependency Removed" },
  score_given: { icon: Star, color: "text-amber-500", label: "Score Given" },
  attachment_added: { icon: Paperclip, color: "text-blue-500", label: "Attachment Added" },
  member_added: { icon: UserPlus, color: "text-emerald-500", label: "Member Added" },
  member_removed: { icon: UserMinus, color: "text-red-500", label: "Member Removed" },
};

const EVENT_TYPES = Object.keys(EVENT_TYPE_CONFIG);

export default function AuditTrailPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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

  // Fetch audit trail
  const fetchAuditTrail = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "25");
      if (search) params.set("search", search);
      if (eventType && eventType !== "all") params.set("eventType", eventType);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const wsId = localStorage.getItem("planzo_active_workspace") || "";
      if (wsId && wsId !== "all") params.set("workspaceId", wsId);

      const res = await fetch(`/api/audit-trail?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch audit trail:", err);
    }
    setLoading(false);
  }, [page, search, eventType, startDate, endDate, wsVersion]);

  useEffect(() => {
    fetchAuditTrail();
  }, [fetchAuditTrail]);

  // Search debounce
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Export CSV
  const handleExport = () => {
    if (entries.length === 0) return;
    const headers = ["Date", "Event Type", "Description", "Performed By", "Project", "Task", "Old Value", "New Value"];
    const rows = entries.map((e) => [
      e.createdAt ? new Date(e.createdAt).toISOString() : "",
      e.eventType || "",
      (e.description || "").replace(/,/g, ";"),
      e.performedByName || e.performedBy || "",
      e.projectName || "",
      e.taskName || "",
      (e.oldValue || "").replace(/,/g, ";"),
      (e.newValue || "").replace(/,/g, ";"),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* ── Controls ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Complete log of all events • {total} entries
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={entries.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* ── Filters ────────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events, people, tasks..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={eventType} onValueChange={(v) => { setEventType(v); setPage(1); }}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {EVENT_TYPE_CONFIG[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-[140px] h-9 text-sm"
                placeholder="From"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-[140px] h-9 text-sm"
                placeholder="To"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Table ──────────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[180px]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Timestamp
                    </div>
                  </TableHead>
                  <TableHead className="w-[160px]">Event</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[140px]">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Performed By
                    </div>
                  </TableHead>
                  <TableHead className="w-[140px]">Related To</TableHead>
                  <TableHead className="w-[120px]">Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Activity className="h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No audit entries found</p>
                        <p className="text-xs text-muted-foreground/70">
                          Events will appear here as actions are performed
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry, i) => {
                    const config = EVENT_TYPE_CONFIG[entry.eventType] || {
                      icon: Activity,
                      color: "text-muted-foreground",
                      label: entry.eventType,
                    };
                    const EventIcon = config.icon;
                    const time = entry.createdAt
                      ? new Date(entry.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";

                    return (
                      <TableRow
                        key={entry.eventId || i}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {time}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-md flex items-center justify-center bg-muted`}>
                              <EventIcon className={`h-3.5 w-3.5 ${config.color}`} />
                            </div>
                            <span className="text-xs font-medium">{config.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm truncate max-w-[300px]">{entry.description}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-primary">
                                {(nameMap[entry.performedBy] || entry.performedByName || entry.performedBy || "?").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs truncate max-w-[100px]">
                              {nameMap[entry.performedBy] || entry.performedByName || entry.performedBy}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {entry.projectName && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[120px]">
                                {entry.projectName}
                              </p>
                            )}
                            {entry.taskName && (
                              <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {entry.taskName}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(entry.oldValue || entry.newValue) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  {entry.oldValue && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 line-through text-red-500 dark:text-red-400">
                                      {entry.oldValue.substring(0, 12)}
                                    </Badge>
                                  )}
                                  {entry.oldValue && entry.newValue && <span className="text-muted-foreground">→</span>}
                                  {entry.newValue && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 text-emerald-600 dark:text-emerald-400">
                                      {entry.newValue.substring(0, 12)}
                                    </Badge>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1 text-xs">
                                  {entry.field && <p className="font-semibold">Field: {entry.field}</p>}
                                  {entry.oldValue && <p>Old: {entry.oldValue}</p>}
                                  {entry.newValue && <p>New: {entry.newValue}</p>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ──────────────────────────────────────── */}
          {!loading && entries.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * 25 + 1}-{Math.min(page * 25, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-medium px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </TooltipProvider>
  );
}
