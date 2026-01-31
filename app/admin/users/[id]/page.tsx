"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Shield, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  Hash,
  PenTool,
  Globe
} from "lucide-react";
import { useHeaderActions } from "@/components/providers/header-actions-provider";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  AppRole: "Super Admin" | "Manager";
  isActive: boolean;
  serialNo?: string;
  designation?: string;
  bioDescription?: string;
  profilePicture?: string;
  signature?: string;
  isOnWebsite?: boolean;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setLeftContent } = useHeaderActions();

  useEffect(() => {
    setLeftContent(
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">User Details</h1>
      </div>
    );
    return () => setLeftContent(null);
  }, [setLeftContent, router]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${id}`);
        if (!response.ok) {
           if (response.status === 404) throw new Error("User not found");
           throw new Error("Failed to fetch user");
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "An error occurred");
        router.push("/admin/users");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Card */}
      {/* Header Card Refined to match 'Ocean Consulting' style */}
      <div className="rounded-3xl overflow-hidden bg-zinc-950 text-white shadow-xl flex flex-col md:flex-row min-h-[400px]">
         {/* Left Side - Hero Image */}
         <div className="w-full md:w-2/5 relative bg-zinc-900 min-h-[300px] md:min-h-full">
            {user.profilePicture ? (
               <img 
                  src={user.profilePicture} 
                  alt={user.name} 
                  className="absolute inset-0 w-full h-full object-cover opacity-90" 
               />
            ) : (
               <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                  <UserIcon className="h-32 w-32 text-zinc-600" />
               </div>
            )}
            {/* Optional Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-950/20" />
         </div>

         {/* Right Side - Content */}
         <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center space-y-6">
            <div className="space-y-2">
               <p className="text-zinc-400 font-medium tracking-wide text-sm uppercase">Member Profile</p>
               <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">{user.name}</h1>
            </div>

            <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
               {user.bioDescription || "Enrich your expertise and grow your career. The development of both technical and human skills is at the heart of our Group's success."}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
               {/* Role Badge */}
               <div className="inline-flex items-center px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900/50 text-zinc-300 text-sm font-medium">
                  <Shield className="mr-2 h-4 w-4 text-emerald-500" />
                  {user.AppRole}
               </div>

               {/* Designation Badge */}
               <div className="inline-flex items-center px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900/50 text-zinc-300 text-sm font-medium">
                  <Briefcase className="mr-2 h-4 w-4 text-blue-500" />
                  {user.designation || "Team Member"}
               </div>

               {/* Designation Badge */}
               <div className="inline-flex items-center px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900/50 text-zinc-300 text-sm font-medium">
                  <Briefcase className="mr-2 h-4 w-4 text-blue-500" />
                  {user.designation || "Team Member"}
               </div>

               {/* Website Visibility Badge */}
               <div className={`inline-flex items-center px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900/50 text-sm font-medium ${user.isOnWebsite ? "text-purple-400" : "text-zinc-500"}`}>
                  <Globe className={`mr-2 h-4 w-4 ${user.isOnWebsite ? "text-purple-500" : "text-zinc-500"}`} />
                  {user.isOnWebsite ? "On Website" : "Hidden"}
               </div>

               {/* Status Badge */}
               <div className={`inline-flex items-center px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900/50 text-sm font-medium ${user.isActive ? "text-green-400" : "text-red-400"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
                  {user.isActive ? "Active" : "Inactive"}
               </div>
            </div>

             <div className="pt-4">
                <Button className="bg-white text-black hover:bg-zinc-200 rounded-lg px-8 py-6 text-base font-semibold">
                   Edit Profile
                </Button>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <Card className="md:col-span-1 h-fit shadow-md border-t-4 border-t-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               <UserIcon className="h-5 w-5 text-primary" />
               Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="group flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-semibold break-all">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="group flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-sm font-semibold">{user.phone || "Not provided"}</p>
              </div>
            </div>
            <Separator />
            <div className="group flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-sm font-semibold">{user.address || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Bio & Other Info */}
        <div className="md:col-span-2 space-y-6">
           {/* Website Status Card */}
           <Card className="shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-full ${user.isOnWebsite ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
                        {user.isOnWebsite ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                     </div>
                     <div>
                        <p className="font-semibold">Website Visibility</p>
                        <p className="text-sm text-muted-foreground">
                            {user.isOnWebsite ? "This user is currently visible on the public website." : "This user is hidden from the public website."}
                        </p>
                     </div>
                  </div>
              </CardContent>
           </Card>

           {/* Bio Card */}
           <Card className="shadow-md">
             <CardHeader>
                <CardTitle className="text-lg">Biography</CardTitle>
             </CardHeader>
             <CardContent>
                {user.bioDescription ? (
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {user.bioDescription}
                    </p>
                ) : (
                    <div className="text-center py-8 text-muted-foreground italic">
                        No biography provided.
                    </div>
                )}
             </CardContent>
           </Card>

           {/* Signature Card */}
           <Card className="shadow-md">
              <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-primary" />
                    Digital Signature
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 {user.signature ? (
                    <div className="border rounded-lg p-4 bg-white flex justify-center">
                        <img src={user.signature} alt="Signature" className="max-h-32 object-contain" />
                    </div>
                 ) : (
                    <div className="text-center py-8 text-muted-foreground italic bg-muted/20 rounded-lg border border-dashed">
                        No digital signature on file.
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
