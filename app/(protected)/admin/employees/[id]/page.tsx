"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Briefcase, 
  FileText, 
  ShieldCheck, 
  AlertTriangle,
  Pencil,
  CheckCircle2,
  XCircle,
  Truck,
  IdCard,
  Building2,
  CalendarCheck,
  TrendingUp,
  Star,
  Zap,
  Award,
  BarChart3,
  Target,
  Hash,
  CreditCard,
  FileCheck,
  Download,
  ExternalLink,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { IEmployee } from "@/lib/models/Employee";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { format, startOfWeek, addDays } from "date-fns";
import { useHeaderActions } from "@/components/providers/header-actions-provider";
import { EmployeeForm } from "@/components/admin/employee-form";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PageProps = {
  params: Promise<{ id: string }>;
};

/* ── Availability Day Pill ── */
const DayPill = ({ day, date, status, dayKey, handleStatusChange }: any) => {
  const statusConfig: Record<string, { color: string; bg: string; dot: string; label: string }> = {
    'Route':           { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Route' },
    'Assign Schedule': { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500', label: 'Assign' },
    'Open':            { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-500', label: 'Open' },
    'Close':           { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-500', label: 'Close' },
    'OFF':             { color: 'text-zinc-400 dark:text-zinc-500', bg: 'bg-zinc-500/5 border-zinc-500/10', dot: 'bg-zinc-400', label: 'OFF' },
  };
  const config = statusConfig[status] || statusConfig['OFF'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border transition-all hover:scale-[1.03] active:scale-95 cursor-pointer min-w-0",
          config.bg
        )}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none">{day}</span>
          <span className="text-[8px] text-muted-foreground/40 leading-none">{date}</span>
          <div className={cn("w-2 h-2 rounded-full my-1", config.dot)} />
          <span className={cn("text-[8px] font-black uppercase tracking-tight leading-none", config.color)}>{config.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[150px] rounded-xl p-1 shadow-xl">
        {Object.entries(statusConfig).map(([id, cfg]) => (
          <DropdownMenuItem 
            key={id} 
            onClick={() => handleStatusChange(dayKey, id)}
            className={cn(
              "text-[10px] font-bold py-2 px-3 rounded-lg cursor-pointer flex items-center gap-2",
              status === id ? "bg-primary/10 text-primary" : "hover:bg-accent"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
            {id}
            {status === id && <CheckCircle2 className="w-3 h-3 text-primary ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function EmployeeDetailPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { setLeftContent, setRightContent } = useHeaderActions();

  const handleStatusChange = async (dayKey: string, newStatus: string) => {
    if (!employee) return;
    const oldEmployee = employee;
    const updatedEmployee = { ...employee, [dayKey]: newStatus };
    setEmployee(updatedEmployee as IEmployee);
    
    try {
      const response = await fetch(`/api/admin/employees/${employee._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [dayKey]: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update");
      toast.success(`${dayKey.charAt(0).toUpperCase() + dayKey.slice(1)} updated`);
    } catch {
      setEmployee(oldEmployee);
      toast.error("Failed to update availability");
    }
  };

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

  // Info display helper
  const InfoItem = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value?: any; accent?: string }) => (
    <div className="flex items-center gap-3 py-2.5">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", accent || "bg-muted/50 dark:bg-white/[0.06]")}>
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none mb-1">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate leading-none">
          {value || <span className="text-muted-foreground/40 font-normal italic text-xs">—</span>}
        </p>
      </div>
    </div>
  );

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

              {/* Contact Details */}
              <div className="space-y-1">
                <InfoItem icon={Mail} label="Email" value={employee.email} />
                <InfoItem icon={Phone} label="Phone" value={formatPhoneNumber(employee.phoneNumber || "")} />
                <InfoItem icon={DollarSign} label="Rate" value={employee.rate ? `$${employee.rate}/hr` : undefined} accent="bg-blue-500/10" />
                <InfoItem icon={Calendar} label="Date of Birth" value={employee.dob ? format(new Date(employee.dob), "MMMM d, yyyy") : undefined} />
                <InfoItem icon={User} label="Gender" value={employee.gender} />
                <InfoItem icon={Hash} label="Hourly Status" value={(employee as any).hourlyStatus} />
              </div>

              <Separator className="my-4 bg-border/40" />

              {/* Address */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 dark:bg-white/[0.04] border border-border/30">
                <MapPin className="w-4 h-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                  {[employee.streetAddress, employee.city, employee.state, employee.zipCode].filter(Boolean).join(", ") || "No address provided"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Weekly Schedule ── */}
          <div className="rounded-2xl border border-border/50 dark:border-white/10 bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarCheck className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Weekly Schedule</h3>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][idx];
                const status = String(employee[dayKey as keyof IEmployee] || 'OFF');
                const date = format(addDays(startOfWeek(new Date()), idx), "M/d");
                return <DayPill key={day} day={day} date={date} status={status} dayKey={dayKey} handleStatusChange={handleStatusChange} />;
              })}
            </div>
            {employee.ScheduleNotes && (
              <div className="mt-3 p-3 rounded-lg bg-muted/30 dark:bg-white/[0.04] border border-border/20">
                <p className="text-[11px] text-muted-foreground italic leading-relaxed">{employee.ScheduleNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* ════════ RIGHT COLUMN: Tabs ════════ */}
        <div className="lg:col-span-8 space-y-0">
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="bg-muted/30 dark:bg-white/[0.04] p-1 rounded-xl inline-flex gap-0.5 h-auto mb-5 border border-border/40">
              {[
                { value: "performance", label: "Performance" },
                { value: "logistics", label: "Logistics" },
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

            {/* ──────── PERFORMANCE TAB ──────── */}
            <TabsContent value="performance" className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300 mt-0">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Rank", value: "#12", icon: Award, accent: "from-amber-500 to-orange-500", trend: "+3" },
                  { label: "Rating", value: "96%", icon: Star, accent: "from-blue-500 to-indigo-500", trend: "+4%", pct: 96, pctColor: "bg-blue-500" },
                  { label: "Efficiency", value: "94%", icon: Zap, accent: "from-emerald-500 to-teal-500", trend: "+5%", pct: 94, pctColor: "bg-emerald-500" },
                  { label: "ScoreCard", value: "98%", icon: Target, accent: "from-purple-500 to-violet-500", pct: 98, pctColor: "bg-purple-500" },
                ].map((kpi) => (
                  <div key={kpi.label} className="relative rounded-2xl border border-border/40 dark:border-white/[0.08] bg-card p-4 group hover:shadow-md transition-all overflow-hidden">
                    <div className={cn("absolute top-0 left-0 w-1 h-full rounded-r-full bg-gradient-to-b", kpi.accent)} />
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{kpi.label}</span>
                      <div className="p-1.5 rounded-lg bg-muted/40 dark:bg-white/[0.06]">
                        <kpi.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-black tracking-tight text-foreground leading-none">{kpi.value}</span>
                      {kpi.trend && (
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5 mb-0.5">
                          <TrendingUp className="w-3 h-3" /> {kpi.trend}
                        </span>
                      )}
                    </div>
                    {kpi.pct && (
                      <div className="h-1 w-full bg-muted/50 dark:bg-white/10 rounded-full overflow-hidden mt-3">
                        <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", kpi.pctColor)} style={{ width: `${kpi.pct}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Task & Hours Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Task Completion */}
                <div className="rounded-2xl border border-border/40 dark:border-white/[0.08] bg-card p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Task Completion</h4>
                    <BarChart3 className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total", value: "201", color: "bg-blue-500" },
                      { label: "Completed", value: "143", color: "bg-emerald-500" },
                      { label: "In Progress", value: "38", color: "bg-amber-500" },
                      { label: "Pending", value: "20", color: "bg-rose-500" },
                    ].map((stat) => (
                      <div key={stat.label} className="p-3 rounded-xl bg-muted/20 dark:bg-white/[0.03] border border-border/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", stat.color)} />
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                        </div>
                        <span className="text-2xl font-black text-foreground leading-none">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Hours Ring */}
                <div className="rounded-2xl border border-border/40 dark:border-white/[0.08] bg-card p-5 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Weekly Hours</h4>
                    <Clock className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                  
                  <div className="relative w-36 h-36 my-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className="stroke-muted/30 dark:stroke-white/10" />
                      <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="53" className="stroke-primary transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-foreground tracking-tighter leading-none">80<span className="text-lg text-muted-foreground">%</span></span>
                      <div className="flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10">
                        <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-[9px] font-bold text-emerald-500">+23%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full border-t border-border/30 pt-4 mt-2">
                    <div className="text-center flex-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">This Week</p>
                      <p className="text-lg font-black text-foreground">38.5<span className="text-xs font-medium text-muted-foreground ml-0.5">h</span></p>
                    </div>
                    <div className="w-px h-8 bg-border/30" />
                    <div className="text-center flex-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Avg/Week</p>
                      <p className="text-lg font-black text-foreground">41.2<span className="text-xs font-medium text-muted-foreground ml-0.5">h</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ──────── LOGISTICS TAB ──────── */}
            <TabsContent value="logistics" className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300 mt-0">
              {/* Vehicle Assignments */}
              <div className="rounded-2xl border border-border/40 dark:border-white/[0.08] bg-card p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Truck className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Vehicle Assignments</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: "Primary Van", value: employee.defaultVan1 },
                    { label: "Backup Van 1", value: employee.defaultVan2 },
                    { label: "Backup Van 2", value: employee.defaultVan3 },
                  ].map((van) => (
                    <div key={van.label} className="p-3 rounded-xl bg-muted/20 dark:bg-white/[0.03] border border-border/20">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{van.label}</p>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground/40" />
                        <span className="text-sm font-semibold text-foreground">{van.value || <span className="text-muted-foreground/40 italic font-normal text-xs">Unassigned</span>}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Identification & Details */}
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
                  <InfoItem icon={CreditCard} label="Gas Card PIN" value={employee.gasCardPin} />
                  <InfoItem icon={Building2} label="Routes Comp" value={employee.routesComp} />
                  <InfoItem icon={Calendar} label="DL Expiration" value={employee.dlExpiration ? format(new Date(employee.dlExpiration), "MMM dd, yyyy") : undefined} />
                  <InfoItem icon={Calendar} label="MVR Date" value={employee.motorVehicleReportDate ? format(new Date(employee.motorVehicleReportDate), "MMM dd, yyyy") : undefined} />
                </div>
              </div>
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
