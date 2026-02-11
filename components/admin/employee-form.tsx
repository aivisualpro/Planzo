"use client";

import React from "react";

interface EmployeeFormProps {
  employee?: any;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export function EmployeeForm({ employee, onSave, onCancel }: EmployeeFormProps) {
  return (
    <div className="p-4 text-sm text-muted-foreground">
      Employee form placeholder — implement as needed.
    </div>
  );
}
