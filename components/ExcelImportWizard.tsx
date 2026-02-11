// ExcelImportWizard — KEY COMPONENT
// Handles: file drop → SheetJS parse → column mapping → validation → import

"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface MappableField {
  key: string;
  label: string;
  required: boolean;
  aliases: string[]; // lowercase fuzzy-match candidates
}

interface ParsedRow {
  [key: string]: string | number;
}

interface MappedRow {
  shipperName: string;
  teuQty: string;
  revenueInr: number;
  profitabilityPct: number;
  notes: string;
  _hasError: boolean;
  _errorMsg: string;
  _rowIndex: number;
}

type WizardStep = "upload" | "mapping" | "validation" | "importing" | "done";

// ──────────────────────────────────────────────
// Field definitions with fuzzy aliases
// ──────────────────────────────────────────────

const FIELDS: MappableField[] = [
  {
    key: "shipperName",
    label: "Shipper / Client Name",
    required: true,
    aliases: [
      "shipper",
      "shipper name",
      "client",
      "client name",
      "customer",
      "party",
      "party name",
      "consignee",
      "name",
    ],
  },
  {
    key: "teuQty",
    label: "TEU / Quantity",
    required: false,
    aliases: [
      "teu",
      "teus",
      "total teu",
      "total teus",
      "qty",
      "quantity",
      "containers",
      "cntr",
      "no of teus",
      "no. of teus",
    ],
  },
  {
    key: "revenueInr",
    label: "Revenue (INR)",
    required: true,
    aliases: [
      "revenue",
      "total revenue",
      "revenue inr",
      "revenue (inr)",
      "rev",
      "amount",
      "total amount",
      "turnover",
      "sales",
      "billing",
      "value",
    ],
  },
  {
    key: "profitabilityPct",
    label: "Profitability %",
    required: true,
    aliases: [
      "profitability",
      "profitability %",
      "profitability%",
      "profit %",
      "profit%",
      "margin",
      "margin %",
      "margin%",
      "gp%",
      "gp %",
      "gross profit",
      "profit pct",
    ],
  },
  {
    key: "notes",
    label: "Notes / Remarks",
    required: false,
    aliases: [
      "notes",
      "remarks",
      "comment",
      "comments",
      "observation",
      "remark",
    ],
  },
];

// ──────────────────────────────────────────────
// Fuzzy column matching
// ──────────────────────────────────────────────

function fuzzyMatch(
  excelHeaders: string[],
  fields: MappableField[]
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const field of fields) {
    for (const header of excelHeaders) {
      const normalised = header.toLowerCase().trim();
      if (field.aliases.includes(normalised)) {
        mapping[field.key] = header;
        break;
      }
    }
    // Partial match fallback
    if (!mapping[field.key]) {
      for (const header of excelHeaders) {
        const normalised = header.toLowerCase().trim();
        for (const alias of field.aliases) {
          if (normalised.includes(alias) || alias.includes(normalised)) {
            mapping[field.key] = header;
            break;
          }
        }
        if (mapping[field.key]) break;
      }
    }
  }

  return mapping;
}

// ──────────────────────────────────────────────
// Parse profitability value
// ──────────────────────────────────────────────

function parseProfitability(val: string | number): number {
  if (typeof val === "number") {
    // If > 1, assume it's a percentage, e.g. 16 → 0.16
    return val > 1 ? val / 100 : val;
  }
  const cleaned = String(val).replace(/[%,\s]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return num > 1 ? num / 100 : num;
}

// ──────────────────────────────────────────────
// Parse revenue value (remove commas, ₹, etc.)
// ──────────────────────────────────────────────

function parseRevenue(val: string | number): number {
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[₹,\s]/g, "");
  return parseFloat(cleaned) || 0;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

interface ExcelImportWizardProps {
  quarter: string;
  quarterType: string;
  onComplete?: () => void;
}

export default function ExcelImportWizard({
  quarter,
  quarterType,
  onComplete,
}: ExcelImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );
  const [mappedRows, setMappedRows] = useState<MappedRow[]>([]);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    field: string;
  } | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    skippedDetails: { row: number; reason: string }[];
  } | null>(null);
  const [error, setError] = useState("");

  // ── Step 1: File upload ────────────────────
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Parse to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(sheet, {
          defval: "",
        });

        if (jsonData.length === 0) {
          setError("No data found in the spreadsheet");
          return;
        }

        const excelHeaders = Object.keys(jsonData[0]);
        setHeaders(excelHeaders);
        setRawRows(jsonData);

        // Auto-match columns
        const autoMapping = fuzzyMatch(excelHeaders, FIELDS);
        setColumnMapping(autoMapping);

        setStep("mapping");
      } catch {
        setError("Failed to parse file. Please ensure it's a valid Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  // ── Step 2→3: Apply mapping and validate ──
  const applyMapping = useCallback(() => {
    const required = FIELDS.filter((f) => f.required);
    const missing = required.filter((f) => !columnMapping[f.key]);
    if (missing.length > 0) {
      setError(
        `Please map required columns: ${missing.map((f) => f.label).join(", ")}`
      );
      return;
    }
    setError("");

    const mapped: MappedRow[] = rawRows.map((raw, idx) => {
      const shipperName = String(
        raw[columnMapping.shipperName] || ""
      ).trim();
      const teuQty = String(raw[columnMapping.teuQty] || "").trim();
      const revenueInr = parseRevenue(
        raw[columnMapping.revenueInr] ?? 0
      );
      const profitabilityPct = parseProfitability(
        raw[columnMapping.profitabilityPct] ?? 0
      );
      const notes = columnMapping.notes
        ? String(raw[columnMapping.notes] || "").trim()
        : "";

      // Validation
      const errors: string[] = [];
      if (!shipperName) errors.push("Missing shipper name");
      if (revenueInr === 0) errors.push("Revenue is zero");
      if (profitabilityPct < 0) errors.push("Negative profitability");
      if (profitabilityPct > 1) errors.push("Profitability > 100%");

      return {
        shipperName,
        teuQty,
        revenueInr,
        profitabilityPct,
        notes,
        _hasError: errors.length > 0,
        _errorMsg: errors.join("; "),
        _rowIndex: idx + 1,
      };
    });

    setMappedRows(mapped);
    setStep("validation");
  }, [rawRows, columnMapping]);

  // ── Inline edit in validation table ────────
  const updateRow = (rowIdx: number, field: string, value: string) => {
    setMappedRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[rowIdx] };

      if (field === "revenueInr") {
        row.revenueInr = parseRevenue(value);
      } else if (field === "profitabilityPct") {
        row.profitabilityPct = parseProfitability(value);
      } else {
        (row as Record<string, unknown>)[field] = value;
      }

      // Re-validate
      const errors: string[] = [];
      if (!row.shipperName) errors.push("Missing shipper name");
      if (row.revenueInr === 0) errors.push("Revenue is zero");
      if (row.profitabilityPct < 0) errors.push("Negative profitability");
      if (row.profitabilityPct > 1) errors.push("Profitability > 100%");
      row._hasError = errors.length > 0;
      row._errorMsg = errors.join("; ");

      updated[rowIdx] = row;
      return updated;
    });
  };

  const removeRow = (rowIdx: number) => {
    setMappedRows((prev) => prev.filter((_, i) => i !== rowIdx));
  };

  // ── Step 4: Submit import ──────────────────
  const doImport = async () => {
    setStep("importing");
    try {
      const res = await fetch("/api/sales/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: mappedRows,
          quarter,
          quarterType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        setStep("validation");
        return;
      }
      setImportResult(data);
      setStep("done");
    } catch {
      setError("Network error during import");
      setStep("validation");
    }
  };

  // ── Stats ──────────────────────────────────
  const validCount = useMemo(
    () => mappedRows.filter((r) => !r._hasError).length,
    [mappedRows]
  );
  const errorCount = useMemo(
    () => mappedRows.filter((r) => r._hasError).length,
    [mappedRows]
  );

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════

  // ── Upload step ────────────────────────────
  if (step === "upload") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Excel Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the file here...</p>
            ) : (
              <>
                <p className="text-lg font-medium">
                  Drag &amp; drop your Excel file here
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or click to browse — supports .xlsx, .xls, .csv
                </p>
              </>
            )}
          </div>
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Mapping step ───────────────────────────
  if (step === "mapping") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Map Columns — {fileName}
            </span>
            <Badge variant="secondary">{rawRows.length} rows detected</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            We auto-matched your columns. Verify and adjust the mapping below.
          </p>

          <div className="space-y-4">
            {FIELDS.map((field) => (
              <div
                key={field.key}
                className="flex items-center gap-4"
              >
                <div className="w-48 shrink-0">
                  <span className="text-sm font-medium">{field.label}</span>
                  {field.required && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </div>
                <Select
                  value={columnMapping[field.key] || "__none__"}
                  onValueChange={(val) =>
                    setColumnMapping((prev) => ({
                      ...prev,
                      [field.key]: val === "__none__" ? "" : val,
                    }))
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Not mapped —</SelectItem>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {columnMapping[field.key] && (
                  <Badge variant="success" className="text-xs">
                    Matched
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setHeaders([]);
                setRawRows([]);
                setColumnMapping({});
                setError("");
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={applyMapping}>
              Validate Data
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Validation step ────────────────────────
  if (step === "validation") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Review &amp; Validate
            </span>
            <div className="flex gap-2">
              <Badge variant="success">{validCount} valid</Badge>
              {errorCount > 0 && (
                <Badge variant="destructive">{errorCount} errors</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click a cell to edit. Rows with errors are highlighted in red. Remove
            bad rows with ✕ or fix inline.
          </p>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="max-h-[500px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Shipper</TableHead>
                  <TableHead>TEU / Qty</TableHead>
                  <TableHead className="text-right">Revenue (₹)</TableHead>
                  <TableHead className="text-right">Profit %</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-10">Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappedRows.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className={row._hasError ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="text-muted-foreground">
                      {row._rowIndex}
                    </TableCell>
                    {/* Shipper */}
                    <TableCell>
                      {editingCell?.row === idx &&
                      editingCell?.field === "shipperName" ? (
                        <Input
                          defaultValue={row.shipperName}
                          autoFocus
                          className="h-8"
                          onBlur={(e) => {
                            updateRow(idx, "shipperName", e.target.value);
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateRow(
                                idx,
                                "shipperName",
                                (e.target as HTMLInputElement).value
                              );
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() =>
                            setEditingCell({ row: idx, field: "shipperName" })
                          }
                        >
                          {row.shipperName || (
                            <span className="text-destructive">—</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    {/* TEU */}
                    <TableCell>
                      {editingCell?.row === idx &&
                      editingCell?.field === "teuQty" ? (
                        <Input
                          defaultValue={row.teuQty}
                          autoFocus
                          className="h-8 w-24"
                          onBlur={(e) => {
                            updateRow(idx, "teuQty", e.target.value);
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateRow(
                                idx,
                                "teuQty",
                                (e.target as HTMLInputElement).value
                              );
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() =>
                            setEditingCell({ row: idx, field: "teuQty" })
                          }
                        >
                          {row.teuQty || "—"}
                        </span>
                      )}
                    </TableCell>
                    {/* Revenue */}
                    <TableCell className="text-right">
                      {editingCell?.row === idx &&
                      editingCell?.field === "revenueInr" ? (
                        <Input
                          defaultValue={row.revenueInr}
                          autoFocus
                          className="h-8 w-32 text-right"
                          onBlur={(e) => {
                            updateRow(idx, "revenueInr", e.target.value);
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateRow(
                                idx,
                                "revenueInr",
                                (e.target as HTMLInputElement).value
                              );
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() =>
                            setEditingCell({ row: idx, field: "revenueInr" })
                          }
                        >
                          {row.revenueInr.toLocaleString("en-IN")}
                        </span>
                      )}
                    </TableCell>
                    {/* Profitability */}
                    <TableCell className="text-right">
                      {editingCell?.row === idx &&
                      editingCell?.field === "profitabilityPct" ? (
                        <Input
                          defaultValue={(row.profitabilityPct * 100).toFixed(2)}
                          autoFocus
                          className="h-8 w-20 text-right"
                          onBlur={(e) => {
                            updateRow(
                              idx,
                              "profitabilityPct",
                              e.target.value
                            );
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateRow(
                                idx,
                                "profitabilityPct",
                                (e.target as HTMLInputElement).value
                              );
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() =>
                            setEditingCell({
                              row: idx,
                              field: "profitabilityPct",
                            })
                          }
                        >
                          {(row.profitabilityPct * 100).toFixed(2)}%
                        </span>
                      )}
                    </TableCell>
                    {/* Notes */}
                    <TableCell>
                      {editingCell?.row === idx &&
                      editingCell?.field === "notes" ? (
                        <Input
                          defaultValue={row.notes}
                          autoFocus
                          className="h-8"
                          onBlur={(e) => {
                            updateRow(idx, "notes", e.target.value);
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateRow(
                                idx,
                                "notes",
                                (e.target as HTMLInputElement).value
                              );
                              setEditingCell(null);
                            }
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer text-muted-foreground hover:underline"
                          onClick={() =>
                            setEditingCell({ row: idx, field: "notes" })
                          }
                        >
                          {row.notes || "—"}
                        </span>
                      )}
                    </TableCell>
                    {/* Status */}
                    <TableCell>
                      {row._hasError ? (
                        <span title={row._errorMsg}>
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </span>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </TableCell>
                    {/* Remove */}
                    <TableCell>
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeRow(idx)}
                        title="Remove row"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep("mapping")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Mapping
            </Button>
            <Button onClick={doImport} disabled={validCount === 0}>
              Import {validCount} Rows
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Importing step ─────────────────────────
  if (step === "importing") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Importing data...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we process your {mappedRows.length} rows
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Done step ──────────────────────────────
  if (step === "done" && importResult) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <CheckCircle2 className="mb-4 h-12 w-12 text-green-600" />
          <p className="text-xl font-semibold">Import Complete!</p>
          <div className="mt-4 flex gap-4">
            <Badge variant="success" className="text-sm">
              {importResult.imported} imported
            </Badge>
            {importResult.skipped > 0 && (
              <Badge variant="warning" className="text-sm">
                {importResult.skipped} skipped
              </Badge>
            )}
          </div>
          {importResult.skippedDetails.length > 0 && (
            <div className="mt-4 max-h-40 overflow-auto rounded-md border p-3 text-sm">
              <p className="mb-2 font-medium text-muted-foreground">
                Skipped rows:
              </p>
              {importResult.skippedDetails.map((s, i) => (
                <p key={i} className="text-destructive">
                  Row {s.row}: {s.reason}
                </p>
              ))}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setFileName("");
                setHeaders([]);
                setRawRows([]);
                setColumnMapping({});
                setMappedRows([]);
                setImportResult(null);
                setError("");
              }}
            >
              Import Another File
            </Button>
            {onComplete && (
              <Button onClick={onComplete}>View My Data</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
