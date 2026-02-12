"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Printer, TrendingUp, Package, DollarSign, BarChart3 } from "lucide-react";

// ──────────────────────────────────────────────
// Rakhi Maam — Actual Data (July-Sep 2025)
// ──────────────────────────────────────────────

interface ActualRow {
  srNo: number;
  shipper: string;
  quarter: string;
  teus: number;
  revenue: number;
  profitPct: number;
  profit: number;
}

const actualData: ActualRow[] = [
  { srNo: 1, shipper: "HMSI", quarter: "July-Sep", teus: 1306, revenue: 213000000, profitPct: 16, profit: 34080000 },
  { srNo: 2, shipper: "SUZUKI", quarter: "July-Sep", teus: 452, revenue: 45000000, profitPct: 6, profit: 2700000 },
  { srNo: 3, shipper: "INDIA YAMAHA MOTORCYCLES", quarter: "July-Sep", teus: 220, revenue: 55000000, profitPct: 16, profit: 8800000 },
  { srNo: 4, shipper: "HONDA MOTOR INDIA", quarter: "July-Sep", teus: 206, revenue: 23000000, profitPct: 10, profit: 2300000 },
  { srNo: 5, shipper: "HERO MOTO CORP", quarter: "July-Sep", teus: 390, revenue: 90500000, profitPct: 14, profit: 12670000 },
  { srNo: 6, shipper: "HONDA CARS", quarter: "July-Sep", teus: 699, revenue: 1250000, profitPct: 50, profit: 625000 },
  { srNo: 7, shipper: "COLOMBO NOMINATION", quarter: "July-Sep", teus: 60, revenue: 240000, profitPct: 14, profit: 33600 },
  { srNo: 8, shipper: "RICE EXPORTERS", quarter: "July-Sep", teus: 308, revenue: 915000, profitPct: 28, profit: 256200 },
];

const actualTotalTeus = actualData.reduce((s, r) => s + r.teus, 0);
const actualTotalRevenue = actualData.reduce((s, r) => s + r.revenue, 0);
const actualTotalProfit = actualData.reduce((s, r) => s + r.profit, 0);
const actualAvgProfitPct = actualTotalRevenue > 0 ? (actualTotalProfit / actualTotalRevenue) * 100 : 0;

// ──────────────────────────────────────────────
// Projections (Oct-Dec 2025)
// ──────────────────────────────────────────────

interface ProjectionRow {
  srNo: number;
  shipper: string;
  quarter: string;
  teusExpected: string;
  actualTeus?: string;
  actualRevenue?: string;
  actualProfitPct?: string;
}

const projectionData: ProjectionRow[] = [
  { srNo: 1, shipper: "JINDAL ALUMUNIUM", quarter: "Oct-Dec", teusExpected: "30-40 (Custom Clearance)" },
  { srNo: 2, shipper: "R.S INFRA", quarter: "Oct-Dec", teusExpected: "30-40" },
  { srNo: 3, shipper: "COLOMBO NOMINATION", quarter: "Oct-Dec", teusExpected: "30-40" },
  { srNo: 4, shipper: "CHITTAGONG NOMINATION", quarter: "Oct-Dec", teusExpected: "40-50" },
  { srNo: 5, shipper: "PHILLIPINES NOMINATION", quarter: "Oct-Dec", teusExpected: "20-30" },
];

// ──────────────────────────────────────────────
// Pipeline (Jan-Mar 2026)
// ──────────────────────────────────────────────

interface PipelineRow {
  srNo: number;
  shipper: string;
  quarter: string;
  teus: string;
  revenue: string;
  profitPct: string;
}

const pipelineData: PipelineRow[] = Array.from({ length: 11 }, (_, i) => ({
  srNo: i + 1,
  shipper: "",
  quarter: "Jan - Mar",
  teus: "",
  revenue: "",
  profitPct: "",
}));

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatINR(amount: number): string {
  if (amount >= 1e7) return `₹ ${(amount / 1e7).toFixed(2)} Cr`;
  if (amount >= 1e5) return `₹ ${(amount / 1e5).toFixed(2)} L`;
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

function formatINRFull(amount: number): string {
  return `₹ ${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function SalesReportPage() {
  const handlePrint = () => window.print();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── Report Header ─────────────────────── */}
      <div className="flex items-center justify-between print:justify-center">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.webp"
            alt="Company Logo"
            width={64}
            height={64}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-orange-600">
              Sales Performance Report
            </h1>
            <p className="text-muted-foreground text-lg">
              Sales Person: <span className="font-semibold text-foreground">Rakhi Maam</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total TEUs</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{actualTotalTeus.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground">July — Sep 2025</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{formatINR(actualTotalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{formatINRFull(actualTotalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatINR(actualTotalProfit)}</div>
            <p className="text-xs text-muted-foreground">{formatINRFull(actualTotalProfit)}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profitability</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{actualAvgProfitPct.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Weighted average</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 1: Actual Quarter (July-Sep 2025)
          ═══════════════════════════════════════ */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Actual Quarter — July&apos;2025 to Sep&apos;25</CardTitle>
              <p className="text-orange-100 text-sm mt-1">Current quarter performance with 8 active shippers</p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 text-lg px-3 py-1">
              {actualData.length} Shippers
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-orange-50/50">
                  <TableHead className="w-14 font-bold">Sr. No.</TableHead>
                  <TableHead className="font-bold">Shipper</TableHead>
                  <TableHead className="font-bold">Quarter</TableHead>
                  <TableHead className="text-right font-bold">TEUs</TableHead>
                  <TableHead className="text-right font-bold">Total Revenue (INR)</TableHead>
                  <TableHead className="text-right font-bold">Profitability %</TableHead>
                  <TableHead className="text-right font-bold">Profit (INR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actualData.map((row) => (
                  <TableRow key={row.srNo} className="hover:bg-orange-50/30">
                    <TableCell className="font-medium text-muted-foreground">{row.srNo}</TableCell>
                    <TableCell className="font-semibold">{row.shipper}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        {row.quarter}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{row.teus.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right font-mono">{formatINRFull(row.revenue)}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={
                          row.profitPct >= 15
                            ? "bg-green-100 text-green-800 border-green-300"
                            : row.profitPct >= 10
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : "bg-red-100 text-red-800 border-red-300"
                        }
                      >
                        {row.profitPct}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">{formatINRFull(row.profit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-orange-100/60 font-bold text-base">
                  <TableCell colSpan={3} className="font-bold text-orange-700">
                    TOTAL
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-orange-700">
                    {actualTotalTeus.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-orange-700">
                    {formatINRFull(actualTotalRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-orange-700">
                    {actualAvgProfitPct.toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-orange-700">
                    {formatINRFull(actualTotalProfit)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════
          SECTION 2: Projections (Oct-Dec 2025)
          ═══════════════════════════════════════ */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Projections — Sep to Dec, 2025</CardTitle>
              <p className="text-blue-100 text-sm mt-1">Expected volumes from prospective shippers</p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 text-lg px-3 py-1">
              {projectionData.length} Prospects
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50/50">
                  <TableHead className="w-14 font-bold">Sr. No.</TableHead>
                  <TableHead className="font-bold">Shipper</TableHead>
                  <TableHead className="font-bold">Quarter</TableHead>
                  <TableHead className="font-bold">Expected TEUs</TableHead>
                  <TableHead className="font-bold text-right">Actual TEUs</TableHead>
                  <TableHead className="font-bold text-right">Actual Revenue (INR)</TableHead>
                  <TableHead className="font-bold text-right">Actual Profitability %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectionData.map((row) => (
                  <TableRow key={row.srNo} className="hover:bg-blue-50/30">
                    <TableCell className="font-medium text-muted-foreground">{row.srNo}</TableCell>
                    <TableCell className="font-semibold">{row.shipper}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        {row.quarter}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{row.teusExpected}</TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-blue-100/60 font-bold">
                  <TableCell colSpan={4} className="font-bold text-blue-700">
                    Total Volume — Expected
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-700">—</TableCell>
                  <TableCell className="text-right font-bold text-blue-700">—</TableCell>
                  <TableCell className="text-right font-bold text-blue-700">—</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════
          SECTION 3: Pipeline (Jan-Mar 2026)
          ═══════════════════════════════════════ */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Clients in Pipeline — Jan to March, 2026</CardTitle>
              <p className="text-purple-100 text-sm mt-1">Deals under discussion for upcoming quarter</p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 text-lg px-3 py-1">
              Pipeline
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-50/50">
                  <TableHead className="w-14 font-bold">Sr. No.</TableHead>
                  <TableHead className="font-bold">Shipper</TableHead>
                  <TableHead className="font-bold">Quarter</TableHead>
                  <TableHead className="font-bold text-right">Total TEUs</TableHead>
                  <TableHead className="font-bold text-right">Total Revenue (INR)</TableHead>
                  <TableHead className="font-bold text-right">Profitability %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipelineData.map((row) => (
                  <TableRow key={row.srNo} className="hover:bg-purple-50/30">
                    <TableCell className="font-medium text-muted-foreground">{row.srNo}</TableCell>
                    <TableCell className="text-muted-foreground italic">—</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-purple-600 border-purple-300">
                        {row.quarter}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-purple-100/60 font-bold">
                  <TableCell colSpan={3} className="font-bold text-purple-700">
                    Total Volume — Expected
                  </TableCell>
                  <TableCell className="text-right font-bold text-purple-700">0</TableCell>
                  <TableCell className="text-right font-bold text-purple-700">₹ 0</TableCell>
                  <TableCell className="text-right font-bold text-purple-700">—</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Footer ──────────────────────────── */}
      <div className="text-center text-sm text-muted-foreground print:block pb-8">
        <p>Report generated by <span className="font-semibold text-orange-600">TigerOps</span> — Sales Intelligence &amp; Operations Platform</p>
        <p className="mt-1">Confidential — For internal use only</p>
      </div>

      {/* ── Print styles ────────────────────── */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          nav, header, aside { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
