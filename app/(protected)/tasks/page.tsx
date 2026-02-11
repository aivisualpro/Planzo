"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search, Filter, Plus, LayoutGrid, List, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, MoreHorizontal, Ban, CheckCircle2,
  Clock, AlertTriangle, Flag, Star, ArrowUpRight,
  GripVertical, MessageSquare, Link2, SlidersHorizontal, X,
  Paperclip, ListChecks, Timer, Trash2, Upload, FileIcon, ImageIcon,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useHeaderActions } from "@/components/providers/header-actions-provider";

// ── Status & Priority Config ──────────────────────────────────────
const STATUSES = ["Not Started", "In Progress", "For Review", "Blocked", "Completed"];
const PRIORITIES = ["Urgent", "High", "Normal", "Low"];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Not Started": { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", dot: "bg-slate-400" },
  "In Progress": { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  "For Review": { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  "Blocked": { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
  "Completed": { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
};

const PRIORITY_COLORS: Record<string, string> = {
  "Urgent": "text-red-600 dark:text-red-400",
  "High": "text-orange-600 dark:text-orange-400",
  "Normal": "text-blue-600 dark:text-blue-400",
  "Low": "text-slate-500 dark:text-slate-400",
};

// ── Status Badge ──────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["Not Started"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${PRIORITY_COLORS[priority] || ""}`}>
      <Flag className="h-3 w-3" />
      {priority}
    </span>
  );
}

// ── Kanban Card (with drag support) ───────────────────────────────
function KanbanCard({ task, onClick, nameMap = {}, onAttachmentClick, onSubtaskClick, onHoursClick }: {
  task: any; onClick: () => void; nameMap?: Record<string, string>;
  onAttachmentClick?: (task: any) => void;
  onSubtaskClick?: (task: any) => void;
  onHoursClick?: (task: any) => void;
}) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Completed";
  const assigneeName = task.assignee ? (nameMap[task.assignee] || task.assignee) : "";
  const attachmentCount = (task.attachments?.length || 0);
  const subtaskCount = task.subtaskCount || 0;
  const subtaskCompleted = task.subtaskCompletedCount || 0;
  const timeLogged = task.timeLogged || 0;
  const estimatedHours = task.estimatedHours || 0;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.taskId);
        e.dataTransfer.effectAllowed = "move";
        (e.currentTarget as HTMLElement).style.opacity = "0.5";
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
      onClick={onClick}
      className="p-3 rounded-lg border bg-card hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing group"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {task.taskName}
        </h4>
        {task.isBlocked && <Ban className="h-3.5 w-3.5 text-red-500 flex-shrink-0 ml-1" />}
      </div>
      {task.taskDescription && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.taskDescription}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {task.priority && <PriorityBadge priority={task.priority} />}
        {task.dueDate && (
          <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
            <Clock className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
      {task.progress > 0 && (
        <div className="mt-2">
          <Progress value={task.progress} className="h-1" />
        </div>
      )}

      {/* ── Meta Icons Row: Attachments, Subtasks, Hours ── */}
      <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-border/40">
        <button
          onClick={(e) => { e.stopPropagation(); onAttachmentClick?.(task); }}
          className={`flex items-center gap-1 px-1.5 py-1 rounded-md cursor-pointer transition-colors hover:bg-muted ${attachmentCount > 0 ? "text-foreground" : "text-muted-foreground/50 hover:text-foreground"}`}
        >
          <Paperclip className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">{attachmentCount}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSubtaskClick?.(task); }}
          className={`flex items-center gap-1 px-1.5 py-1 rounded-md cursor-pointer transition-colors hover:bg-muted ${
            subtaskCount > 0 && subtaskCompleted === subtaskCount
              ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              : subtaskCount > 0
                ? "text-foreground"
                : "text-muted-foreground/50 hover:text-foreground"
          }`}
        >
          <ListChecks className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">{subtaskCompleted}/{subtaskCount}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onHoursClick?.(task); }}
          className={`flex items-center gap-1 px-1.5 py-1 rounded-md cursor-pointer transition-colors hover:bg-muted ${timeLogged > 0 ? "text-foreground" : "text-muted-foreground/50 hover:text-foreground"}`}
        >
          <Timer className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">
            {timeLogged > 0 ? `${timeLogged}h` : "0h"}
            {estimatedHours > 0 ? `/${estimatedHours}h` : ""}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between mt-2">
        {assigneeName && (
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-[9px] font-bold text-primary">
                {assigneeName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{assigneeName}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {task.tags?.length > 0 && (
            <span className="text-[10px]">{task.tags.length} tags</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Calendar Day Cell ─────────────────────────────────────────────
function CalendarDayCell({
  date, tasks, isToday, isCurrentMonth, onTaskClick,
}: {
  date: Date; tasks: any[]; isToday: boolean; isCurrentMonth: boolean; onTaskClick: (t: any) => void;
}) {
  return (
    <div className={`min-h-[100px] border-r border-b p-1 ${!isCurrentMonth ? "bg-muted/20" : ""} ${isToday ? "bg-primary/5" : ""}`}>
      <div className={`text-xs font-medium mb-0.5 ${isToday ? "text-primary" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"}`}>
        {date.getDate()}
      </div>
      <div className="space-y-0.5">
        {tasks.slice(0, 3).map((t, i) => {
          const c = STATUS_COLORS[t.status] || STATUS_COLORS["Not Started"];
          return (
            <div
              key={t.taskId || i}
              onClick={() => onTaskClick(t)}
              className={`text-[10px] px-1.5 py-0.5 rounded ${c.bg} ${c.text} truncate cursor-pointer hover:opacity-80 transition-opacity`}
            >
              {t.taskName}
            </div>
          );
        })}
        {tasks.length > 3 && (
          <div className="text-[10px] text-muted-foreground px-1">+{tasks.length - 3} more</div>
        )}
      </div>
    </div>
  );
}

// ── New Task Dialog ───────────────────────────────────────────────
function NewTaskDialog({
  open, onClose, onCreated, workspaceId,
}: {
  open: boolean; onClose: () => void; onCreated: () => void; workspaceId: string;
}) {
  const [form, setForm] = useState({
    taskName: "", taskDescription: "", priority: "Normal",
    status: "Not Started", dueDate: "", assignee: "", tags: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.taskName.trim()) { toast.error("Task name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          workspaceId: workspaceId !== "all" ? workspaceId : undefined,
          tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
          dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
        }),
      });
      if (res.ok) {
        toast.success("Task created!");
        setForm({ taskName: "", taskDescription: "", priority: "Normal", status: "Not Started", dueDate: "", assignee: "", tags: "" });
        onCreated();
        onClose();
      } else {
        toast.error("Failed to create task");
      }
    } catch { toast.error("Error creating task"); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            New Task
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Task Name *</Label>
            <Input value={form.taskName} onChange={(e) => setForm({ ...form, taskName: e.target.value })} placeholder="Enter task name" className="mt-1" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.taskDescription} onChange={(e) => setForm({ ...form, taskDescription: e.target.value })} placeholder="Describe the task..." className="mt-1" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Assignee</Label>
              <Input value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Name or email" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="design, frontend, urgent" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Attachments Dialog ────────────────────────────────────────────
function AttachmentsDialog({
  open, onClose, task, onUpdated,
}: {
  open: boolean; onClose: () => void; task: any; onUpdated: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const attachments: string[] = task?.attachments || [];

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      const newUrl = uploadData.secure_url || uploadData.url;

      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.taskId, attachments: [...attachments, newUrl] }),
      });
      if (res.ok) {
        toast.success("File attached!");
        onUpdated();
      } else throw new Error();
    } catch {
      toast.error("Failed to upload file");
    }
    setUploading(false);
  };

  const handleRemove = async (index: number) => {
    const updated = attachments.filter((_: string, i: number) => i !== index);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.taskId, attachments: updated }),
      });
      if (res.ok) {
        toast.success("Attachment removed");
        onUpdated();
      }
    } catch {
      toast.error("Failed to remove attachment");
    }
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-primary" />
            Attachments
            <Badge variant="secondary" className="text-xs">{attachments.length}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Upload Zone */}
          <label
            className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              uploading ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/30"
            }`}
          >
            <input
              type="file"
              className="hidden"
              multiple
              disabled={uploading}
              onChange={(e) => {
                const files = e.target.files;
                if (files) Array.from(files).forEach(handleUpload);
                e.target.value = "";
              }}
            />
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground font-medium">
              {uploading ? "Uploading..." : "Click or drop files here"}
            </span>
          </label>

          {/* Existing Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {attachments.map((url: string, i: number) => {
                const fileName = url.split("/").pop() || `File ${i + 1}`;
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20 group">
                    {isImage(url) ? (
                      <img src={url} alt="" className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{fileName}</p>
                      <p className="text-[10px] text-muted-foreground">{isImage(url) ? "Image" : "File"}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer"><ArrowUpRight className="h-3.5 w-3.5" /></a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleRemove(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Subtasks Dialog ───────────────────────────────────────────────
function SubtasksDialog({
  open, onClose, task, onUpdated,
}: {
  open: boolean; onClose: () => void; task: any; onUpdated: () => void;
}) {
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch subtasks when dialog opens
  useEffect(() => {
    if (open && task?.taskId) {
      setLoading(true);
      fetch(`/api/tasks?taskId=${task.taskId}&subtasks=true`)
        .then(async () => {
          // Subtasks are in their own collection, fetch directly
          const res = await fetch(`/api/subtasks?taskId=${task.taskId}`);
          if (res.ok) {
            const data = await res.json();
            setSubtasks(data.subtasks || []);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, task?.taskId]);

  const handleAdd = async () => {
    if (!newSubtask.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.taskId,
          subTask: newSubtask.trim(),
          subtaskId: `ST-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubtasks(prev => [...prev, data.subtask || { subtaskId: Date.now(), subTask: newSubtask.trim(), status: "Not Started", taskId: task.taskId }]);
        setNewSubtask("");
        onUpdated();
        toast.success("Subtask added");
      }
    } catch {
      toast.error("Failed to add subtask");
    }
    setSaving(false);
  };

  const handleToggle = async (subtask: any) => {
    const newStatus = subtask.status === "Completed" ? "Not Started" : "Completed";
    setSubtasks(prev => prev.map(s => s.subtaskId === subtask.subtaskId ? { ...s, status: newStatus } : s ));
    try {
      await fetch("/api/subtasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId: subtask.subtaskId, status: newStatus }),
      });
      onUpdated();
    } catch {
      setSubtasks(prev => prev.map(s => s.subtaskId === subtask.subtaskId ? { ...s, status: subtask.status } : s));
    }
  };

  const handleDelete = async (subtaskId: string) => {
    const prev = subtasks;
    setSubtasks(s => s.filter(st => st.subtaskId !== subtaskId));
    try {
      await fetch("/api/subtasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId }),
      });
      onUpdated();
      toast.success("Subtask deleted");
    } catch {
      setSubtasks(prev);
      toast.error("Failed to delete subtask");
    }
  };

  const completed = subtasks.filter(s => s.status === "Completed").length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Subtasks
            {subtasks.length > 0 && (
              <Badge variant="secondary" className="text-xs">{completed}/{subtasks.length}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* Add subtask input */}
          <div className="flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add a subtask..."
              className="text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} disabled={saving || !newSubtask.trim()} className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          {subtasks.length > 0 && (
            <div className="flex items-center gap-2">
              <Progress value={subtasks.length > 0 ? (completed / subtasks.length) * 100 : 0} className="h-1.5 flex-1" />
              <span className="text-[10px] font-medium text-muted-foreground">{Math.round(subtasks.length > 0 ? (completed / subtasks.length) * 100 : 0)}%</span>
            </div>
          )}

          {/* Subtask list */}
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            ) : subtasks.length === 0 ? (
              <div className="text-center py-6">
                <ListChecks className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No subtasks yet</p>
              </div>
            ) : (
              subtasks.map((st) => (
                <div key={st.subtaskId} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/40 group transition-colors">
                  <Checkbox
                    checked={st.status === "Completed"}
                    onCheckedChange={() => handleToggle(st)}
                    className="h-4 w-4"
                  />
                  <span className={`text-sm flex-1 ${st.status === "Completed" ? "line-through text-muted-foreground" : ""}`}>
                    {st.subTask}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(st.subtaskId)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Log Hours Dialog ──────────────────────────────────────────────
function LogHoursDialog({
  open, onClose, task, onUpdated,
}: {
  open: boolean; onClose: () => void; task: any; onUpdated: () => void;
}) {
  const [timeLogged, setTimeLogged] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && task) {
      setTimeLogged(String(task.timeLogged || ""));
      setEstimatedHours(String(task.estimatedHours || ""));
    }
  }, [open, task]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.taskId,
          timeLogged: timeLogged ? parseFloat(timeLogged) : 0,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 0,
        }),
      });
      if (res.ok) {
        toast.success("Hours updated");
        onUpdated();
        onClose();
      } else throw new Error();
    } catch {
      toast.error("Failed to update hours");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Log Hours
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Task</p>
            <p className="text-sm font-semibold truncate">{task?.taskName}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Time Logged (hours)</Label>
              <Input
                type="number"
                min="0"
                step="0.25"
                value={timeLogged}
                onChange={(e) => setTimeLogged(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Estimated Hours</Label>
              <Input
                type="number"
                min="0"
                step="0.25"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
          {/* Visual Progress */}
          {(parseFloat(timeLogged) > 0 || parseFloat(estimatedHours) > 0) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                <span>Progress</span>
                <span>
                  {parseFloat(timeLogged) || 0}h / {parseFloat(estimatedHours) || 0}h
                  {parseFloat(estimatedHours) > 0 && (
                    <> ({Math.round(((parseFloat(timeLogged) || 0) / parseFloat(estimatedHours)) * 100)}%)</>  
                  )}
                </span>
              </div>
              <Progress
                value={parseFloat(estimatedHours) > 0 ? Math.min(((parseFloat(timeLogged) || 0) / parseFloat(estimatedHours)) * 100, 100) : 0}
                className="h-2"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Hours"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════
// ██  MAIN TASKS PAGE  ██
// ══════════════════════════════════════════════════════════════════
export default function TasksPage() {
  const { setLeftContent, setRightContent } = useHeaderActions();
  const [tasks, setTasks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"spreadsheet" | "board" | "calendar">("spreadsheet");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [page, setPage] = useState(1);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [metaDialogTask, setMetaDialogTask] = useState<any>(null);
  const [metaDialogType, setMetaDialogType] = useState<"attachments" | "subtasks" | "hours" | null>(null);
  const activeFilterCount = (statusFilter && statusFilter !== "all" ? 1 : 0) + (priorityFilter && priorityFilter !== "all" ? 1 : 0);

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

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", "100");
    if (search) params.set("search", search);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter && priorityFilter !== "all") params.set("priority", priorityFilter);
    const wsId = localStorage.getItem("planzo_active_workspace") || "";
    if (wsId && wsId !== "all") params.set("workspaceId", wsId);

    try {
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setTotal(data.total || 0);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [page, search, statusFilter, priorityFilter, wsVersion]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Quick status update (optimistic) ──────────────────────────────
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    // Optimistic: update local state immediately
    const prevTasks = [...tasks];
    setTasks(prev =>
      prev.map(t =>
        t.taskId === taskId
          ? {
              ...t,
              status: newStatus,
              ...(newStatus === "Completed" ? { completionDate: new Date().toISOString(), completedOnTime: true } : {}),
            }
          : t
      )
    );

    // Background: persist to API
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          status: newStatus,
          ...(newStatus === "Completed" ? { completionDate: new Date(), completedOnTime: true } : {}),
        }),
      });
      if (res.ok) {
        toast.success(`Status → ${newStatus}`);
      } else {
        // Revert on failure
        setTasks(prevTasks);
        toast.error("Failed to update status");
      }
    } catch {
      // Revert on error
      setTasks(prevTasks);
      toast.error("Failed to update status");
    }
  };

  // ── Calendar helpers ────────────────────────────────────────────
  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const days: Date[] = [];
    const current = new Date(startDate);
    while (days.length < 42) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate();
    });
  };

  // ── Group tasks by status for board view ────────────────────────
  const groupedByStatus: Record<string, any[]> = {};
  STATUSES.forEach(s => { groupedByStatus[s] = []; });
  tasks.forEach(t => {
    const status = STATUSES.includes(t.status) ? t.status : "Not Started";
    groupedByStatus[status]?.push(t);
  });

  // ── Push controls into the site header ──────────────────────────
  const searchRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLeftContent(
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent whitespace-nowrap">
          Tasks
        </h1>
        <Badge variant="secondary" className="text-xs font-medium tabular-nums">
          {total}
        </Badge>
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            ref={searchRef}
            placeholder="Search tasks..."
            defaultValue={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="flex h-8 w-[180px] lg:w-[220px] rounded-md border border-input bg-background px-3 pl-8 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>
    );
    setRightContent(
      <div className="flex items-center gap-1.5">
        <Tabs value={view} onValueChange={(v: any) => setView(v)}>
          <TabsList className="h-8">
            <TabsTrigger value="spreadsheet" className="gap-1 text-[11px] px-2 h-7">
              <List className="h-3 w-3" /> <span className="hidden lg:inline">Spreadsheet</span>
            </TabsTrigger>
            <TabsTrigger value="board" className="gap-1 text-[11px] px-2 h-7">
              <LayoutGrid className="h-3 w-3" /> <span className="hidden lg:inline">Board</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1 text-[11px] px-2 h-7">
              <CalendarIcon className="h-3 w-3" /> <span className="hidden lg:inline">Calendar</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs relative"
          onClick={() => setShowFilters(true)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button size="sm" onClick={() => setShowNewTask(true)} className="h-8 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Task
        </Button>
      </div>
    );
    return () => {
      setLeftContent(null);
      setRightContent(null);
    };
  }, [total, view, activeFilterCount]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* ── Filter Dialog ──────────────────────────────────────── */}
        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                <Select value={statusFilter || "all"} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Priority</Label>
                <Select value={priorityFilter || "all"} onValueChange={v => { setPriorityFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStatusFilter(""); setPriorityFilter(""); setPage(1); }}
                className="gap-1.5 text-xs"
              >
                <X className="h-3.5 w-3.5" /> Clear Filters
              </Button>
              <Button size="sm" onClick={() => setShowFilters(false)} className="text-xs">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ██  SPREADSHEET VIEW  ██ */}
        {/* ══════════════════════════════════════════════════════════ */}
        {view === "spreadsheet" && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[1200px] table-fixed">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[30px]"></TableHead>
                    <TableHead className="min-w-[220px]">Task</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead className="w-[90px]">Priority</TableHead>
                    <TableHead className="w-[120px]">Assignee</TableHead>
                    <TableHead className="w-[95px]">Start Date</TableHead>
                    <TableHead className="w-[95px]">Due Date</TableHead>
                    <TableHead className="w-[75px]">Est. Hrs</TableHead>
                    <TableHead className="w-[70px]">Logged</TableHead>
                    <TableHead className="w-[80px]">Progress</TableHead>
                    <TableHead className="w-[100px]">Created By</TableHead>
                    <TableHead className="w-[90px]">Approval</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-2 w-14" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))
                  ) : tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">No tasks found</p>
                          <Button size="sm" variant="outline" onClick={() => setShowNewTask(true)} className="mt-2 gap-1.5">
                            <Plus className="h-3.5 w-3.5" /> Create first task
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Completed";
                      const fmtDate = (d: string | undefined) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
                      return (
                        <TableRow
                          key={task.taskId}
                          className="hover:bg-muted/20 transition-colors group cursor-pointer"
                          onClick={() => setSelectedTask(task)}
                        >
                          <TableCell className="text-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={task.status === "Completed"}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateTaskStatus(task.taskId, task.status === "Completed" ? "Not Started" : "Completed");
                                }}
                                className="h-4 w-4 rounded border-muted-foreground/30 text-primary focus:ring-primary cursor-pointer"
                              />
                              <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${task.status === "Completed" ? "line-through text-muted-foreground" : ""}`}>
                                  {task.taskName}
                                </p>
                                {task.tags?.length > 0 && (
                                  <div className="flex gap-1 mt-0.5">
                                    {task.tags.slice(0, 3).map((tag: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-[10px] h-4 px-1">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {task.isBlocked && (
                                <Tooltip>
                                  <TooltipTrigger><Ban className="h-3.5 w-3.5 text-red-500" /></TooltipTrigger>
                                  <TooltipContent>Blocked: {task.blockerNotes || "No notes"}</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <Select value={task.status} onValueChange={v => updateTaskStatus(task.taskId, v)}>
                              <SelectTrigger className="h-7 text-xs border-0 shadow-none p-0 w-auto">
                                <StatusBadge status={task.status} />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell><PriorityBadge priority={task.priority || "Normal"} /></TableCell>
                          <TableCell>
                            {task.assignee && (
                              <div className="flex items-center gap-1.5">
                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[9px] font-bold text-primary">{(nameMap[task.assignee] || task.assignee).charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="text-xs truncate max-w-[80px]">{nameMap[task.assignee] || task.assignee}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">{fmtDate(task.startDate)}</span>
                          </TableCell>
                          <TableCell>
                            {task.dueDate && (
                              <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                                {fmtDate(task.dueDate)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.estimatedHours != null && (
                              <span className="text-xs text-muted-foreground">{task.estimatedHours}h</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {(task.timeLogged != null && task.timeLogged > 0) && (
                              <span className="text-xs text-muted-foreground">{task.timeLogged}h</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Progress value={task.progress || 0} className="h-1.5 flex-1" />
                              <span className="text-[10px] text-muted-foreground w-7 text-right">{task.progress || 0}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.createdBy && (
                              <span className="text-xs text-muted-foreground truncate block max-w-[90px]">
                                {nameMap[task.createdBy] || task.createdBy}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.approvalStatus && task.approvalStatus !== "none" && (
                              <Badge
                                variant="secondary"
                                className={`text-[10px] ${
                                  task.approvalStatus === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                                  task.approvalStatus === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                                  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                }`}
                              >
                                {task.approvalStatus}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ██  BOARD VIEW (KANBAN)  ██ */}
        {/* ══════════════════════════════════════════════════════════ */}
        {view === "board" && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {STATUSES.map(status => {
              const statusTasks = groupedByStatus[status] || [];
              const c = STATUS_COLORS[status];
              return (
                <div
                  key={status}
                  className="space-y-3"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    (e.currentTarget as HTMLElement).classList.add("ring-2", "ring-primary/40", "rounded-lg");
                  }}
                  onDragLeave={(e) => {
                    (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-primary/40", "rounded-lg");
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-primary/40", "rounded-lg");
                    const taskId = e.dataTransfer.getData("text/plain");
                    if (taskId) {
                      const draggedTask = tasks.find(t => t.taskId === taskId);
                      if (draggedTask && draggedTask.status !== status) {
                        updateTaskStatus(taskId, status);
                      }
                    }
                  }}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                      <span className="text-sm font-semibold">{status}</span>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded-full">
                        {statusTasks.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Add task button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewTask(true)}
                    className="w-full border-dashed gap-1.5 text-xs h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </Button>

                  {/* Cards */}
                  <div className="space-y-2 min-h-[200px]">
                    {loading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="p-3 rounded-lg border">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))
                    ) : (
                      statusTasks.map(task => (
                        <KanbanCard
                          key={task.taskId}
                          task={task}
                          onClick={() => setSelectedTask(task)}
                          nameMap={nameMap}
                          onAttachmentClick={(t) => { setMetaDialogTask(t); setMetaDialogType("attachments"); }}
                          onSubtaskClick={(t) => { setMetaDialogTask(t); setMetaDialogType("subtasks"); }}
                          onHoursClick={(t) => { setMetaDialogTask(t); setMetaDialogType("hours"); }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ██  CALENDAR VIEW  ██ */}
        {/* ══════════════════════════════════════════════════════════ */}
        {view === "calendar" && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-sm font-semibold">
                  {calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} className="text-center py-2 text-xs font-medium text-muted-foreground border-r last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {getCalendarDays().map((date, i) => {
                  const today = new Date();
                  const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                  return (
                    <CalendarDayCell
                      key={i}
                      date={date}
                      tasks={getTasksForDate(date)}
                      isToday={isToday}
                      isCurrentMonth={date.getMonth() === calendarDate.getMonth()}
                      onTaskClick={setSelectedTask}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Task Detail Dialog ────────────────────────────────── */}
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-lg">
            {selectedTask && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedTask.status} />
                    {selectedTask.isBlocked && <Badge variant="destructive" className="text-[10px]">Blocked</Badge>}
                  </div>
                  <DialogTitle className="mt-2">{selectedTask.taskName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {selectedTask.taskDescription && (
                    <p className="text-sm text-muted-foreground">{selectedTask.taskDescription}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Priority</span>
                      <PriorityBadge priority={selectedTask.priority || "Normal"} />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Assignee</span>
                      <span className="font-medium">{selectedTask.assignee ? (nameMap[selectedTask.assignee] || selectedTask.assignee) : "Unassigned"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Due Date</span>
                      <span className="font-medium">
                        {selectedTask.dueDate
                          ? new Date(selectedTask.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                          : "No date"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Progress</span>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedTask.progress || 0} className="h-2 flex-1" />
                        <span className="text-xs font-medium">{selectedTask.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                  {selectedTask.tags?.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Tags</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedTask.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedTask.blockerNotes && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30">
                      <span className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                        <Ban className="h-3 w-3" /> Blocker Notes
                      </span>
                      <p className="text-sm mt-1">{selectedTask.blockerNotes}</p>
                    </div>
                  )}
                  {selectedTask.approvalStatus && selectedTask.approvalStatus !== "none" && (
                    <div className={`p-3 rounded-lg border ${
                      selectedTask.approvalStatus === "pending" ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/30" :
                      selectedTask.approvalStatus === "approved" ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/30" :
                      "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/30"
                    }`}>
                      <span className="text-xs font-medium">Approval: {selectedTask.approvalStatus}</span>
                      {selectedTask.reviewer && <p className="text-xs text-muted-foreground mt-0.5">Reviewer: {selectedTask.reviewer}</p>}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedTask(null)}>Close</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── New Task Dialog ───────────────────────────────────── */}
        <NewTaskDialog
          open={showNewTask}
          onClose={() => setShowNewTask(false)}
          onCreated={fetchTasks}
          workspaceId={typeof window !== "undefined" ? (localStorage.getItem("planzo_active_workspace") || "") : ""}
        />

        {/* ── Meta Dialogs (Attachments, Subtasks, Hours) ──────── */}
        {metaDialogTask && (
          <>
            <AttachmentsDialog
              open={metaDialogType === "attachments"}
              onClose={() => { setMetaDialogType(null); setMetaDialogTask(null); }}
              task={metaDialogTask}
              onUpdated={fetchTasks}
            />
            <SubtasksDialog
              open={metaDialogType === "subtasks"}
              onClose={() => { setMetaDialogType(null); setMetaDialogTask(null); }}
              task={metaDialogTask}
              onUpdated={fetchTasks}
            />
            <LogHoursDialog
              open={metaDialogType === "hours"}
              onClose={() => { setMetaDialogType(null); setMetaDialogTask(null); }}
              task={metaDialogTask}
              onUpdated={fetchTasks}
            />
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
