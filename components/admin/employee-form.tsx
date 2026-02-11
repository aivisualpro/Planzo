"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

interface EmployeeFormProps {
  employee?: any;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

const Field = ({ label, field, type = "text", placeholder, value, onChange }: {
  label: string; field: string; type?: string; placeholder?: string; value: string; onChange: (field: string, value: string) => void;
}) => (
  <div>
    <Label htmlFor={field} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</Label>
    <Input
      id={field}
      type={type}
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      placeholder={placeholder || label}
      className="h-9 text-sm bg-background"
    />
  </div>
);

export function EmployeeForm({ employee, onSave, onCancel }: EmployeeFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: employee?.firstName || "",
    lastName: employee?.lastName || "",
    fullName: employee?.fullName || "",
    email: employee?.email || "",
    phoneNumber: employee?.phoneNumber || "",
    gender: employee?.gender || "",
    dob: employee?.dob ? new Date(employee.dob).toISOString().split("T")[0] : "",
    status: employee?.status || "Active",
    eligibility: employee?.eligibility || false,
    streetAddress: employee?.streetAddress || "",
    city: employee?.city || "",
    state: employee?.state || "",
    zipCode: employee?.zipCode || "",
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev) => {
      const updated: any = { ...prev, [field]: value };
      if (field === "firstName" || field === "lastName") {
        const first = field === "firstName" ? value : prev.firstName;
        const last = field === "lastName" ? value : prev.lastName;
        updated.fullName = `${first} ${last}`.trim();
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!employee?._id && !employee?.uniqueId) {
        payload.uniqueId = `EMP-${Date.now()}`;
      }
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full justify-start bg-muted/30 p-1 rounded-lg h-auto mb-4">
          <TabsTrigger value="personal" className="text-xs font-bold rounded-md px-3 py-1.5">Personal</TabsTrigger>
          <TabsTrigger value="address" className="text-xs font-bold rounded-md px-3 py-1.5">Address</TabsTrigger>
        </TabsList>

        {/* ── Personal ── */}
        <TabsContent value="personal" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First Name" field="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} />
            <Field label="Last Name" field="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email" field="email" type="email" placeholder="email@example.com" value={form.email} onChange={handleChange} />
            <Field label="Phone Number" field="phoneNumber" placeholder="(555) 555-5555" value={form.phoneNumber} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Gender</Label>
              <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                <SelectTrigger className="h-9 text-sm bg-background"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Date of Birth" field="dob" type="date" value={form.dob} onChange={handleChange} />
            <div>
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Status</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className="h-9 text-sm bg-background"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                  <SelectItem value="Resigned">Resigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch id="eligibility" checked={form.eligibility} onCheckedChange={(v) => handleChange("eligibility", v)} />
            <Label htmlFor="eligibility" className="text-sm font-medium">Eligible for Rehire</Label>
          </div>
        </TabsContent>

        {/* ── Address ── */}
        <TabsContent value="address" className="space-y-4 mt-0">
          <Field label="Street Address" field="streetAddress" placeholder="123 Main St" value={form.streetAddress} onChange={handleChange} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="City" field="city" placeholder="City" value={form.city} onChange={handleChange} />
            <Field label="State" field="state" placeholder="State" value={form.state} onChange={handleChange} />
            <Field label="Zip Code" field="zipCode" placeholder="12345" value={form.zipCode} onChange={handleChange} />
          </div>
        </TabsContent>
      </Tabs>

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
