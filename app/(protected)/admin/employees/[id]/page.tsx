"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Pencil,
  IdCard,
  Hash,
  Briefcase,
  Palette,
  Lock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { IEmployee } from "@/lib/models/Employee";
import { cn } from "@/lib/utils";
import { useHeaderActions } from "@/components/providers/header-actions-provider";
import { EmployeeForm } from "@/components/admin/employee-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EmployeeDetailPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { setLeftContent, setRightContent } = useHeaderActions();

  useEffect(() => {
    if (employee) {
      setLeftContent(
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {employee.fullName}
        </h1>
      );
      setRightContent(
        <Button 
          size="sm"
          className="rounded-lg shadow-md shadow-primary/20 h-8 px-3"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <Pencil className="w-4 h-4 mr-2" /> Edit
        </Button>
      );
    }
    return () => { setLeftContent(null); setRightContent(null); };
  }, [employee, setLeftContent, setRightContent]);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/api/admin/employees/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setEmployee(data);
        } else {
          toast.error("Employee not found");
          router.push("/admin/employees");
        }
      } catch {
        toast.error("Error fetching employee details");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!employee) return null;

  const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value?: any }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-3 py-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted/50 dark:bg-white/[0.06]">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none mb-1">{label}</p>
          <p className="text-sm font-semibold text-foreground truncate leading-none">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      {/* ── Hero Profile Card ── */}
      <div className="rounded-2xl border border-border/50 dark:border-white/10 bg-card overflow-hidden">
        {/* Profile Header with Gradient */}
        <div className="relative h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-card bg-muted shadow-lg">
              {employee.picture ? (
                <img src={employee.picture} alt={employee.fullName} className="w-full h-full object-cover" />
              ) : employee.initials ? (
                <div 
                  className="w-full h-full flex items-center justify-center text-2xl font-black text-white"
                  style={{ backgroundColor: employee.color || 'hsl(var(--primary))' }}
                >
                  {employee.initials}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <User className="w-10 h-10 text-primary/50" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 px-6 pb-6">
          <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight">
            {employee.fullName}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {(employee as any).AppRole && (
              <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                <Shield className="w-3 h-3 mr-1" />
                {(employee as any).AppRole}
              </Badge>
            )}
            {employee.role && (
              <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                {employee.role}
              </Badge>
            )}
            {employee.employeeId && (
              <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border-border/50">
                ID: {employee.employeeId}
              </Badge>
            )}
          </div>

          <Separator className="my-5 bg-border/40" />

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <InfoItem icon={Mail} label="Email" value={employee.email} />
            <InfoItem icon={IdCard} label="Employee ID" value={employee.employeeId} />
            <InfoItem icon={Briefcase} label="Role" value={employee.role} />
            <InfoItem icon={Hash} label="Sort Order" value={employee.sort} />
            <InfoItem icon={Palette} label="Color" value={
              employee.color ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-border inline-block" style={{ backgroundColor: employee.color }} />
                  {employee.color}
                </span>
              ) : undefined
            } />
            <InfoItem icon={User} label="Initials" value={employee.initials} />
          </div>
        </div>
      </div>

      {/* ── Account Security ── */}
      <div className="rounded-2xl border border-border/50 dark:border-white/10 bg-card overflow-hidden p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
            <Lock className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Account Security</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Change Password</p>
            <div className="relative group/pass">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/pass:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Enter new password"
                id="new-password-input"
                className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="h-10 px-6 rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-md shadow-primary/10 whitespace-nowrap"
            onClick={async () => {
              const input = document.getElementById("new-password-input") as HTMLInputElement;
              const newPassword = input.value;
              if (!newPassword) {
                toast.error("Please enter a new password");
                return;
              }
              try {
                const res = await fetch("/api/auth/change-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: employee._id, newPassword }),
                });
                if (!res.ok) throw new Error("Failed to change password");
                toast.success("Password updated successfully");
                input.value = "";
              } catch {
                toast.error("Failed to update password");
              }
            }}
          >
            Update Password
          </Button>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee Profile</DialogTitle>
          </DialogHeader>
          <EmployeeForm 
            employee={{ ...employee, _id: String(employee._id) }} 
            onSave={async (data) => {
              try {
                const res = await fetch(`/api/admin/employees/${employee._id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setEmployee(updated);
                  setIsEditDialogOpen(false);
                  toast.success("Profile updated successfully");
                }
              } catch {
                toast.error("Failed to update profile");
              }
            }} 
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
