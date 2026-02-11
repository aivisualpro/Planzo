"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

interface EmployeeFormProps {
  employee?: any;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export function EmployeeForm({ employee, onSave, onCancel }: EmployeeFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: employee?.fullName || "",
    employeeId: employee?.employeeId || "",
    role: employee?.role || "",
    email: employee?.email || "",
    picture: employee?.picture || "",
    color: employee?.color || "",
    initials: employee?.initials || "",
    sort: employee?.sort ?? "",
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (payload.sort !== "") payload.sort = Number(payload.sort);
      else delete payload.sort;
      if (!employee?._id && !employee?.uniqueId) {
        payload.uniqueId = `EMP-${Date.now()}`;
      }
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Full Name</Label>
          <Input id="fullName" value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} placeholder="Full name" className="h-9 text-sm bg-background" />
        </div>
        <div>
          <Label htmlFor="employeeId" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Employee ID</Label>
          <Input id="employeeId" value={form.employeeId} onChange={(e) => handleChange("employeeId", e.target.value)} placeholder="Employee ID" className="h-9 text-sm bg-background" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="email@example.com" className="h-9 text-sm bg-background" />
        </div>
        <div>
          <Label htmlFor="role" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Role</Label>
          <Input id="role" value={form.role} onChange={(e) => handleChange("role", e.target.value)} placeholder="Role" className="h-9 text-sm bg-background" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="picture" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Picture URL</Label>
          <Input id="picture" value={form.picture} onChange={(e) => handleChange("picture", e.target.value)} placeholder="https://..." className="h-9 text-sm bg-background" />
        </div>
        <div>
          <Label htmlFor="color" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Color</Label>
          <Input id="color" value={form.color} onChange={(e) => handleChange("color", e.target.value)} placeholder="#000000" className="h-9 text-sm bg-background" />
        </div>
        <div>
          <Label htmlFor="initials" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Initials</Label>
          <Input id="initials" value={form.initials} onChange={(e) => handleChange("initials", e.target.value)} placeholder="AB" className="h-9 text-sm bg-background" />
        </div>
      </div>
      <div className="w-1/3">
        <Label htmlFor="sort" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Sort Order</Label>
        <Input id="sort" type="number" value={form.sort} onChange={(e) => handleChange("sort", e.target.value)} placeholder="0" className="h-9 text-sm bg-background" />
      </div>

      {/* ── Footer Actions ── */}
      <Separator className="bg-border/40 mt-5" />
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="h-9 px-4 text-sm font-bold">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving} className="h-9 px-6 text-sm font-bold shadow-md shadow-primary/20">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {employee?._id ? "Save Changes" : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}
