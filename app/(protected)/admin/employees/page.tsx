
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SimpleDataTable } from "@/components/admin/simple-data-table";
import { EmployeeForm } from "@/components/admin/employee-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { User } from "lucide-react";
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

  const columns: ColumnDef<IEmployee>[] = [
    {
       id: "picture",
       header: "Image",
       cell: ({ row }) => (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted overflow-hidden">
               {row.original.picture ? (
                   <img src={row.original.picture} alt="User" className="h-full w-full object-cover" />
               ) : row.original.initials ? (
                   <span className="text-xs font-bold text-muted-foreground">{row.original.initials}</span>
               ) : (
                   <User className="h-5 w-5 text-muted-foreground" />
               )}
          </div>
       ),
     },
     { accessorKey: "fullName", header: "Full Name" },
     { accessorKey: "email", header: "Email" },
     { accessorKey: "role", header: "Role" },
     { accessorKey: "employeeId", header: "Employee ID" },
     { accessorKey: "color", header: "Color", cell: ({ row }) => row.original.color ? (
       <div className="flex items-center gap-2">
         <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: row.original.color }} />
         <span className="text-xs text-muted-foreground">{row.original.color}</span>
       </div>
     ) : null },
     { accessorKey: "initials", header: "Initials" },
     { accessorKey: "sort", header: "Sort" },
  ];

  const initialVisibility = {
    color: false,
    initials: false,
    sort: false,
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
