"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  FileText, 
  ShieldCheck, 
  AlertTriangle,
  Pencil,
  CheckCircle2,
  XCircle,
  IdCard,
  Hash,
  FileCheck,
  ExternalLink,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { IEmployee } from "@/lib/models/Employee";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { format } from "date-fns";
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

  const statusColors: Record<string, string> = {
    Active: "bg-emerald-500",
    Terminated: "bg-red-500",
    Resigned: "bg-amber-500",
    Inactive: "bg-zinc-400",
  };

  // Info display helper — only renders if value is present
  const InfoItem = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value?: any; accent?: string }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-3 py-2.5">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", accent || "bg-muted/50 dark:bg-white/[0.06]")}>
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none mb-1">{label}</p>
          <p className="text-sm font-semibold text-foreground truncate leading-none">{value}</p>
        </div>
      </div>
    );
  };

  const FileItem = ({ label, url, icon: Icon }: { label: string; url?: string; icon: any }) => (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-all group",
      url ? "bg-card border-border/50 hover:border-primary/30 hover:shadow-sm cursor-pointer" : "bg-muted/20 border-dashed border-border/30"
    )}
      onClick={() => url && window.open(url, '_blank')}
    >
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
        url ? "bg-primary/10 group-hover:bg-primary/20" : "bg-muted/50"
      )}>
        <Icon className={cn("w-4 h-4", url ? "text-primary" : "text-muted-foreground/40")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground leading-none">{label}</p>
        <p className={cn("text-[10px] mt-1 leading-none", url ? "text-primary/70" : "text-muted-foreground/40")}>
          {url ? "Document uploaded" : "Not uploaded"}
        </p>
      </div>
      {url && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ════════ LEFT COLUMN: Profile Card ════════ */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* ── Hero Profile Card ── */}
          <div className="rounded-2xl border border-border/50 dark:border-white/10 bg-card overflow-hidden">
            {/* Profile Header with Gradient */}
            <div className="relative h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
              <div className="absolute -bottom-10 left-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-card bg-muted shadow-lg">
                  {employee.profileImage ? (
                    <img src={employee.profileImage} alt={employee.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <User className="w-8 h-8 text-primary/50" />
                    </div>
                  )}
                </div>
              </div>
              {/* Status Dot */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", statusColors[employee.status] || "bg-zinc-400")} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">{employee.status}</span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-14 px-5 pb-5">
              <h2 className="text-xl font-black text-foreground tracking-tight leading-tight">
                {employee.firstName} {employee.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  {employee.type || "Employee"}
                </Badge>
                {employee.eeCode && (
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border-border/50">
                    {employee.eeCode}
                  </Badge>
                )}
                <Badge 
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border-none",
                    employee.eligibility 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  )}
                >
                  {employee.eligibility ? "Eligible" : "Ineligible"}
                </Badge>
              </div>

              <Separator className="my-4 bg-border/40" />

              {/* Contact Details — only fields with data */}
              <div className="space-y-1">
                <InfoItem icon={Mail} label="Email" value={employee.email} />
                <InfoItem icon={Phone} label="Phone" value={formatPhoneNumber(employee.phoneNumber || "") || undefined} />
                <InfoItem icon={Calendar} label="Date of Birth" value={employee.dob ? format(new Date(employee.dob), "MMMM d, yyyy") : undefined} />
                <InfoItem icon={User} label="Gender" value={employee.gender} />
                <InfoItem icon={Hash} label="Hourly Status" value={(employee as any).hourlyStatus} />
              </div>

              {[employee.streetAddress, employee.city, employee.state, employee.zipCode].filter(Boolean).length > 0 && (
                <>
                  <Separator className="my-4 bg-border/40" />
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 dark:bg-white/[0.04] border border-border/30">
                    <MapPin className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                      {[employee.streetAddress, employee.city, employee.state, employee.zipCode].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ════════ RIGHT COLUMN: Tabs ════════ */}
        <div className="lg:col-span-8 space-y-0">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="bg-muted/30 dark:bg-white/[0.04] p-1 rounded-xl inline-flex gap-0.5 h-auto mb-5 border border-border/40">
              {[
                { value: "details", label: "Details" },
                { value: "documents", label: "Documents" },
                ...(employee.status === 'Terminated' || employee.status === 'Resigned' || employee.terminationDate || employee.resignationDate
                  ? [{ value: "offboarding", label: "Offboarding" }] : []
                ),
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className={cn(
                    "rounded-lg px-4 py-2 font-bold text-xs transition-all",
                    "data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary border border-transparent data-[state=active]:border-border/30",
                    tab.value === "offboarding" && "text-red-500/60 data-[state=active]:text-red-500"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ──────── DETAILS TAB ──────── */}
            <TabsContent value="details" className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300 mt-0">
              {/* Employment Info */}
              <div className="rounded-2xl border border-border/40 dark:border-white/[0.08] bg-card p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Employment Info</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                  <InfoItem icon={DollarSign} label="Rate" value={employee.rate ? `$${employee.rate}/hr` : undefined} />
                  <InfoItem icon={Calendar} label="Hired Date" value={(employee as any).hiredDate ? format(new Date((employee as any).hiredDate), "MMM dd, yyyy") : undefined} />
                  <InfoItem icon={Hash} label="EE Code" value={employee.eeCode} />
                  <InfoItem icon={Briefcase} label="Type" value={employee.type} />
                  <InfoItem icon={Hash} label="Hourly Status" value={(employee as any).hourlyStatus} />
                  <InfoItem icon={IdCard} label="Employee ID" value={employee.employeeId} />
                </div>
              </div>

              {/* Weekly Schedule */}
              {(employee.sunday || employee.monday || employee.tuesday || employee.wednesday || employee.thursday || employee.friday || employee.saturday || employee.ScheduleNotes) && (
                <div className="rounded-2xl border border-border/40 dark:border-white/[0.08] bg-card p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Weekly Schedule</h3>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                      const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][idx];
                      const status = String(employee[dayKey as keyof IEmployee] || 'OFF');
                      const isOff = status === 'OFF' || !status;
                      return (
                        <div key={day} className={cn(
                          "flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all",
                          isOff ? "bg-muted/20 border-border/20" : "bg-primary/5 border-primary/20"
                        )}>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">{day}</span>
                          <span className={cn(
                            "text-[10px] font-bold leading-none mt-1",
                            isOff ? "text-muted-foreground/40" : "text-primary"
                          )}>{status}</span>
                        </div>
                      );
                    })}
                  </div>
                  {employee.ScheduleNotes && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/20 dark:bg-white/[0.03] border border-border/20">
                      <p className="text-[11px] text-muted-foreground italic leading-relaxed">{employee.ScheduleNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle Assignments */}
              {(employee.defaultVan1 || employee.defaultVan2 || employee.defaultVan3) && (
                <div className="rounded-2xl border border-border/40 dark:border-white/[0.08] bg-card p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Briefcase className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Vehicle Assignments</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1">
                    <InfoItem icon={Briefcase} label="Primary Van" value={employee.defaultVan1} />
                    <InfoItem icon={Briefcase} label="Backup Van 1" value={employee.defaultVan2} />
                    <InfoItem icon={Briefcase} label="Backup Van 2" value={employee.defaultVan3} />
                  </div>
                </div>
              )}

              {/* Identification & Details */}
              {(employee.badgeNumber || employee.transporterId || employee.gasCardPin || employee.routesComp || employee.dlExpiration || employee.motorVehicleReportDate) && (
                <div className="rounded-2xl border border-border/40 dark:border-white/[0.08] bg-card p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <IdCard className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Identification & Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                    <InfoItem icon={IdCard} label="Badge #" value={employee.badgeNumber} />
                    <InfoItem icon={Briefcase} label="Transporter ID" value={employee.transporterId} />
                    <InfoItem icon={ShieldCheck} label="Gas Card PIN" value={employee.gasCardPin} />
                    <InfoItem icon={Briefcase} label="Routes Comp" value={employee.routesComp} />
                    <InfoItem icon={Calendar} label="DL Expiration" value={employee.dlExpiration ? format(new Date(employee.dlExpiration), "MMM dd, yyyy") : undefined} />
                    <InfoItem icon={Calendar} label="MVR Date" value={employee.motorVehicleReportDate ? format(new Date(employee.motorVehicleReportDate), "MMM dd, yyyy") : undefined} />
                  </div>
                </div>
              )}
            </TabsContent>


            {/* ──────── DOCUMENTS TAB ──────── */}
            <TabsContent value="documents" className="animate-in fade-in slide-in-from-right-2 duration-300 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FileItem label="Offer Letter" url={employee.offerLetterFile} icon={FileText} />
                <FileItem label="Employee Handbook" url={employee.handbookFile} icon={FileText} />
                <FileItem label="Driver's License" url={employee.driversLicenseFile} icon={IdCard} />
                <FileItem label="I-9 Documents" url={employee.i9File} icon={ShieldCheck} />
                <FileItem label="Drug Test Results" url={employee.drugTestFile} icon={FileCheck} />
                <FileItem label="Final Check Cleared" url={employee.finalCheck} icon={DollarSign} />
              </div>
            </TabsContent>

            {/* ──────── OFFBOARDING TAB ──────── */}
            <TabsContent value="offboarding" className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300 mt-0">
              {/* Warning Banner */}
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-200/30 dark:border-red-500/20">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 dark:text-red-300 text-sm">Offboarding Record</h3>
                  <p className="text-xs text-red-600/70 dark:text-red-400/50 mt-0.5">This profile contains sensitive termination or resignation data.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Termination */}
                <div className="rounded-2xl border border-red-200/30 dark:border-red-500/15 bg-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Termination</h4>
                  </div>
                  <InfoItem icon={Calendar} label="Date" value={employee.terminationDate ? format(new Date(employee.terminationDate), "MMM dd, yyyy") : undefined} />
                  <InfoItem icon={AlertTriangle} label="Reason" value={employee.terminationReason} />
                  <FileItem icon={FileText} label="Termination Letter" url={employee.terminationLetter} />
                </div>

                {/* Resignation */}
                <div className="rounded-2xl border border-amber-200/30 dark:border-amber-500/15 bg-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Resignation</h4>
                  </div>
                  <InfoItem icon={Calendar} label="Date" value={employee.resignationDate ? format(new Date(employee.resignationDate), "MMM dd, yyyy") : undefined} />
                  <InfoItem icon={AlertTriangle} label="Type" value={employee.resignationType} />
                  <FileItem icon={FileText} label="Resignation Letter" url={employee.resignationLetter} />
                </div>
              </div>

              {/* System Status & Exit Notes */}
              <div className="rounded-2xl border border-border/40 dark:border-white/[0.08] bg-card p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem icon={Calendar} label="Last Date Worked" value={employee.lastDateWorked ? format(new Date(employee.lastDateWorked), "MMM dd, yyyy") : undefined} />
                  <div className="flex items-center gap-4">
                    {[
                      { label: "Paycom", done: employee.paycomOffboarded },
                      { label: "Amazon", done: employee.amazonOffboarded },
                      { label: "Final Check", done: employee.finalCheckIssued },
                    ].map((sys) => (
                      <div key={sys.label} className="flex items-center gap-1.5 text-xs font-bold">
                        {sys.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-muted-foreground/20" />}
                        {sys.label}
                      </div>
                    ))}
                  </div>
                </div>
                <Separator className="bg-border/30" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Exit Interview Notes
                  </p>
                  <div className="p-3 rounded-xl bg-muted/20 dark:bg-white/[0.03] border border-border/20 text-sm text-foreground/80 italic min-h-[80px]">
                    {employee.exitInterviewNotes || "No exit interview notes documented."}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
