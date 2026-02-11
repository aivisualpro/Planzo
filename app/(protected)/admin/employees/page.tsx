
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SimpleDataTable } from "@/components/admin/simple-data-table";
import { formatPhoneNumber } from "@/lib/utils";
import { EmployeeForm } from "@/components/admin/employee-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash, User, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IEmployee } from "@/lib/models/Employee";


export default function EmployeesPage() {
  
  const [data, setData] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const router = useRouter();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/employees");
      if (response.ok) {
        const employees = await response.json();
        setData(employees);
      } else {
        toast.error("Failed to fetch employees");
      }
    } catch (error) {
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const url = editingItem?._id
        ? `/api/admin/employees/${editingItem._id}`
        : "/api/admin/employees";
      const method = editingItem?._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save employee");

      toast.success(editingItem?._id ? "Employee updated successfully" : "Employee created successfully");
      setIsDialogOpen(false);
      fetchEmployees();
    } catch (error) {
       toast.error("Failed to save employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Are you sure you want to delete this employee?")) return;
      
      try {
          const response = await fetch(`/api/admin/employees/${id}`, {
              method: "DELETE",
          });
          if (!response.ok) throw new Error("Failed to delete employee");
          toast.success("Employee deleted successfully");
          fetchEmployees();
      } catch (error) {
          toast.error("Failed to delete employee");
      }
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: IEmployee) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  // Helper for file link cells
  const FileLinkCell = ({ value }: { value?: string }) => {
    if (!value) return null;
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        View
      </a>
    );
  };

  const columns: ColumnDef<IEmployee>[] = [
    {
       id: "profileImage",
       header: "Image",
       cell: ({ row }) => (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted overflow-hidden">
               {row.original.profileImage ? (
                   <img src={row.original.profileImage} alt="User" className="h-full w-full object-cover" />
               ) : (
                   <User className="h-5 w-5 text-muted-foreground" />
               )}
          </div>
       ),
     },
     { accessorKey: "fullName", header: "Full Name" },
     { accessorKey: "email", header: "Email" },
    { 
      accessorKey: "phoneNumber", 
      header: "Phone",
      cell: ({ row }) => formatPhoneNumber(row.original.phoneNumber || "")
    },
    { accessorKey: "type", header: "Type" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.original.status === 'Active' ? 'bg-green-100 text-green-800' : 
            row.original.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
            'bg-red-100 text-red-800'
        }`}>
            {row.original.status}
        </span>
      )
    },
    // Hidden columns by default
    
    { accessorKey: "streetAddress", header: "Address" },
    { accessorKey: "city", header: "City" },
    { accessorKey: "state", header: "State" },
    { accessorKey: "zipCode", header: "Zip" },
    { accessorKey: "gender", header: "Gender" },
    { accessorKey: "dob", header: "DOB", cell: ({row}) => row.original.dob ? new Date(row.original.dob).toLocaleDateString() : "" },
  

    // Files
    { accessorKey: "offerLetterFile", header: "Offer Letter", cell: ({row}) => <FileLinkCell value={row.original.offerLetterFile} /> },
    { accessorKey: "handbookFile", header: "Handbook", cell: ({row}) => <FileLinkCell value={row.original.handbookFile} /> },
    { accessorKey: "driversLicenseFile", header: "DL File", cell: ({row}) => <FileLinkCell value={row.original.driversLicenseFile} /> },
    { accessorKey: "i9File", header: "I-9", cell: ({row}) => <FileLinkCell value={row.original.i9File} /> },
    { accessorKey: "drugTestFile", header: "Drug Test", cell: ({row}) => <FileLinkCell value={row.original.drugTestFile} /> },

    
    
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/admin/employees/${item._id}`)}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openEditDialog(item)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                   className="text-destructive focus:text-destructive"
                   onClick={() => handleDelete(String(item._id))}
                >
                  <Trash className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Define initial visibility: Show key fields, hide less common ones
  const initialVisibility = {
    // Visible by default: profileImage, firstName, lastName, email, phoneNumber, type, status, actions
    // Also show these key fields:
    eeCode: true,
    rate: true,
    eligibility: true,
    defaultVan1: true,
    hiredDate: true,
    // Weekly schedule visible
    sunday: true,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    // Hidden by default:
    transporterId: false,
    badgeNumber: false,
    streetAddress: false,
    city: false,
    state: false,
    zipCode: false,
    gender: false,
    dob: false,
    hourlyStatus: false,
    gasCardPin: false,
    dlExpiration: false,
    motorVehicleReportDate: false,
    defaultVan2: false,
    defaultVan3: false,
    routesComp: false,
    ScheduleNotes: false,
    offerLetterFile: false,
    handbookFile: false,
    driversLicenseFile: false,
    i9File: false,
    drugTestFile: false,
    paycomOffboarded: false,
    amazonOffboarded: false,
    finalCheckIssued: false,
    finalCheck: false,
    terminationDate: false,
    terminationReason: false,
    terminationLetter: false,
    resignationDate: false,
    resignationType: false,
    resignationLetter: false,
    lastDateWorked: false,
    exitInterviewNotes: false,
  };

  return (
    <div className="w-full h-full">
      <SimpleDataTable 
         data={data} 
         columns={columns} 
         title="Employees" 
         onAdd={openAddDialog} 
         onRowClick={(item) => router.push(`/admin/employees/${item._id}`)}
         loading={loading}
         showColumnToggle={true}
         initialColumnVisibility={initialVisibility}
         enableGlobalFilter={true}
      />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <EmployeeForm 
            employee={editingItem ? { ...editingItem, _id: String(editingItem._id) } : undefined} 
            onSave={handleSubmit} 
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
