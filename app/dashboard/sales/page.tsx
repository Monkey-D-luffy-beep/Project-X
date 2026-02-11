"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import SalesChart from "@/components/SalesChart";
import {
  Plus,
  Save,
  Trash2,
  Loader2,
  TrendingUp,
  BarChart3,
  DollarSign,
  Package,
} from "lucide-react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface LineItem {
  id: string;
  srNo: number;
  shipperName: string;
  quarterLabel: string;
  teuQty: string;
  revenueInr: string; // BigInt serialised as string
  profitabilityPct: number;
  profitInr: string;
  rowType: string;
  notes: string | null;
}

// ──────────────────────────────────────────────
// Quarter options
// ──────────────────────────────────────────────

function getQuarterOptions(): string[] {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let currentFYStart = month >= 3 ? year : year - 1;
  let currentQ = Math.floor(((month + 9) % 12) / 3) + 1;

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

function formatINRFromString(paiseStr: string): string {
  const rupees = Number(paiseStr) / 100;
  if (rupees >= 1e7) return `₹ ${(rupees / 1e7).toFixed(1)} Cr`;
  if (rupees >= 1e5) return `₹ ${(rupees / 1e5).toFixed(1)} L`;
  return `₹ ${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

// ──────────────────────────────────────────────
// New row form state
// ──────────────────────────────────────────────

interface NewRowForm {
  shipperName: string;
  teuQty: string;
  revenueInr: string;
  profitabilityPct: string;
  notes: string;
}

const emptyForm: NewRowForm = {
  shipperName: "",
  teuQty: "",
  revenueInr: "",
  profitabilityPct: "",
  notes: "",
};

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function SalesDashboardPage() {
  useSession(); // ensure authenticated
  const quarterOptions = getQuarterOptions();
  const [quarter, setQuarter] = useState(quarterOptions[0]);
  const [activeTab, setActiveTab] = useState("actual");
  const [items, setItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRow, setNewRow] = useState<NewRowForm>(emptyForm);
  const [showNewRow, setShowNewRow] = useState(false);

  // ── Fetch data ─────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        quarter,
        rowType: activeTab,
      });
      const res = await fetch(`/api/sales/entry?${params}`);
      const data = await res.json();
      if (data.report?.lineItems) {
        setItems(data.report.lineItems);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [quarter, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Add new row ────────────────────────────
  const addRow = async () => {
    if (!newRow.shipperName || !newRow.revenueInr || !newRow.profitabilityPct) return;
    setSaving(true);
    try {
      const res = await fetch("/api/sales/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quarter,
          quarterType: activeTab,
          shipperName: newRow.shipperName,
          quarterLabel: quarter,
          teuQty: newRow.teuQty,
          revenueInr: parseFloat(newRow.revenueInr),
          profitabilityPct: parseFloat(newRow.profitabilityPct) / 100,
          notes: newRow.notes || null,
        }),
      });
      if (res.ok) {
        setNewRow(emptyForm);
        setShowNewRow(false);
        await fetchData();
      }
    } catch {
      // handle silently
    }
    setSaving(false);
  };

  // ── Delete row ─────────────────────────────
  const deleteRow = async (id: string) => {
    if (!confirm("Delete this row?")) return;
    try {
      await fetch(`/api/sales/entry?id=${id}`, { method: "DELETE" });
      await fetchData();
    } catch {
      // handle silently
    }
  };

  // ── Stats ──────────────────────────────────
  const totalRevenue = items.reduce(
    (sum, i) => sum + Number(i.revenueInr),
    0
  );
  const totalProfit = items.reduce(
    (sum, i) => sum + Number(i.profitInr),
    0
  );
  const avgProfitPct =
    items.length > 0
      ? items.reduce((sum, i) => sum + Number(i.profitabilityPct), 0) /
        items.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Sales Data</h1>
          <p className="text-muted-foreground">
            View and manage your quarterly sales entries
          </p>
        </div>
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

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatINRFromString(String(totalRevenue))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatINRFromString(String(totalProfit))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(avgProfitPct * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="actual">Actual</TabsTrigger>
            <TabsTrigger value="projection">Projections</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => setShowNewRow(!showNewRow)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </div>

        {/* Tab content — same table for each */}
        {["actual", "projection", "pipeline"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Shipper Name</TableHead>
                        <TableHead>Quarter</TableHead>
                        <TableHead>TEU / Qty</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Profit %</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* New row form */}
                      {showNewRow && (
                        <TableRow className="bg-primary/5">
                          <TableCell className="text-muted-foreground">
                            —
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Shipper name"
                              className="h-8"
                              value={newRow.shipperName}
                              onChange={(e) =>
                                setNewRow({
                                  ...newRow,
                                  shipperName: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {quarter}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="TEU"
                              className="h-8 w-24"
                              value={newRow.teuQty}
                              onChange={(e) =>
                                setNewRow({
                                  ...newRow,
                                  teuQty: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Revenue ₹"
                              className="h-8 w-32 text-right"
                              value={newRow.revenueInr}
                              onChange={(e) =>
                                setNewRow({
                                  ...newRow,
                                  revenueInr: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Profit %"
                              className="h-8 w-20 text-right"
                              value={newRow.profitabilityPct}
                              onChange={(e) =>
                                setNewRow({
                                  ...newRow,
                                  profitabilityPct: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            Auto
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Notes"
                              className="h-8"
                              value={newRow.notes}
                              onChange={(e) =>
                                setNewRow({
                                  ...newRow,
                                  notes: e.target.value,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={addRow}
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Loading */}
                      {loading && (
                        <TableRow>
                          <TableCell colSpan={9} className="py-8 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Empty */}
                      {!loading && items.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="py-8 text-center text-muted-foreground"
                          >
                            No entries for this quarter yet. Add one above or
                            import from Excel.
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Data rows */}
                      {!loading &&
                        items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-muted-foreground">
                              {item.srNo}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.shipperName}
                            </TableCell>
                            <TableCell>{item.quarterLabel}</TableCell>
                            <TableCell>{item.teuQty || "—"}</TableCell>
                            <TableCell className="text-right">
                              {formatINRFromString(item.revenueInr)}
                            </TableCell>
                            <TableCell className="text-right">
                              {(Number(item.profitabilityPct) * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {formatINRFromString(item.profitInr)}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate text-muted-foreground">
                              {item.notes || "—"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteRow(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                    {!loading && items.length > 0 && (
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={4} className="font-semibold">
                            Total ({items.length} entries)
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatINRFromString(String(totalRevenue))}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {(avgProfitPct * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatINRFromString(String(totalProfit))}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Charts */}
      <SalesChart quarter={quarter} items={items} />
    </div>
  );
}
