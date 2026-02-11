"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ExcelImportWizard from "@/components/ExcelImportWizard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Generate quarter options (current + 3 past)
function getQuarterOptions(): string[] {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();

  // FY starts in April. Apr=Q1, Jul=Q2, Oct=Q3, Jan=Q4
  let currentFYStart = month >= 3 ? year : year - 1; // FY start year
  let currentQ = Math.floor(((month + 9) % 12) / 3) + 1; // Q1-Q4

  const options: string[] = [];
  for (let i = 0; i < 6; i++) {
    options.push(`Q${currentQ}-FY${currentFYStart}-${currentFYStart + 1}`);
    currentQ--;
    if (currentQ === 0) {
      currentQ = 4;
      currentFYStart--;
    }
  }
  return options;
}

export default function ImportPage() {
  const router = useRouter();
  const quarterOptions = getQuarterOptions();
  const [quarter, setQuarter] = useState(quarterOptions[0]);
  const [quarterType, setQuarterType] = useState("actual");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Excel Data</h1>
        <p className="text-muted-foreground">
          Upload your quarterly sales data from an Excel file
        </p>
      </div>

      {/* Quarter & type selectors */}
      <div className="flex items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Quarter</label>
          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {quarterOptions.map((q) => (
                <SelectItem key={q} value={q}>
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Data Type</label>
          <Select value={quarterType} onValueChange={setQuarterType}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="actual">Actual</SelectItem>
              <SelectItem value="projection">Projection</SelectItem>
              <SelectItem value="pipeline">Pipeline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Wizard */}
      <ExcelImportWizard
        quarter={quarter}
        quarterType={quarterType}
        onComplete={() => router.push("/dashboard/sales")}
      />
    </div>
  );
}
