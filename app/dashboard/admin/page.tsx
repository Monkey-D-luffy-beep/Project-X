"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Mail,
  Loader2,
  ArrowRight,
} from "lucide-react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface DashboardData {
  users: {
    total: number;
    active: number;
    byRole: { role: string; count: number }[];
  };
  totals: { revenue: string; profit: string; shipments: number };
  quarterSummaries: {
    quarter: string;
    revenue: string;
    profit: string;
    shipments: number;
    byType: Record<string, number>;
  }[];
  managerSummaries: {
    id: string;
    name: string;
    email: string;
    revenue: string;
    profit: string;
    shipments: number;
    margin: string;
  }[];
  dsrs: { total: number; sent: number; drafts: number };
}

function fmtINR(paiseStr: string): string {
  const rupees = Number(paiseStr) / 100;
  if (rupees >= 1e7) return `₹ ${(rupees / 1e7).toFixed(1)} Cr`;
  if (rupees >= 1e5) return `₹ ${(rupees / 1e5).toFixed(1)} L`;
  if (rupees === 0) return "₹ 0";
  return `₹ ${rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function roleLabel(r: string) {
  return r === "admin"
    ? "Admin"
    : r === "sales_manager"
      ? "Sales Manager"
      : "CS Staff";
}

// ══════════════════════════════════════════════
// Page
// ══════════════════════════════════════════════

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-center text-muted-foreground">
        Failed to load dashboard data.
      </p>
    );
  }

  // Chart data — quarters reversed so oldest → newest (left to right)
  const chartData = [...data.quarterSummaries]
    .reverse()
    .map((q) => ({
      quarter: q.quarter.replace("FY", ""),
      revenue: Math.round(Number(q.revenue) / 100),
      profit: Math.round(Number(q.profit) / 100),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Company-wide sales intelligence overview
        </p>
      </div>

      {/* ── KPI Cards ─────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fmtINR(data.totals.revenue)}
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
              {fmtINR(data.totals.profit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totals.shipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.users.active}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {data.users.total}
              </span>
            </div>
            <div className="mt-1 flex gap-1">
              {data.users.byRole.map((r) => (
                <Badge key={r.role} variant="secondary" className="text-xs">
                  {r.count} {roleLabel(r.role).split(" ")[0]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DSRs</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dsrs.total}</div>
            <div className="mt-1 flex gap-1">
              <Badge variant="success" className="text-xs">
                {data.dsrs.sent} sent
              </Badge>
              <Badge variant="outline" className="text-xs">
                {data.dsrs.drafts} drafts
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue & Profit Chart ────────── */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Revenue &amp; Profit by Quarter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="quarter" className="text-xs" />
                <YAxis
                  tickFormatter={(v) => {
                    if (v >= 1e7) return `${(v / 1e7).toFixed(0)}Cr`;
                    if (v >= 1e5) return `${(v / 1e5).toFixed(0)}L`;
                    return v;
                  }}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(val) => [
                    `₹ ${Number(val).toLocaleString("en-IN")}`,
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--background))",
                  }}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="profit"
                  name="Profit"
                  fill="hsl(142 76% 36%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Manager Leaderboard ───────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Sales Manager Leaderboard
          </CardTitle>
          <Link href="/dashboard/admin/users">
            <Button variant="ghost" size="sm">
              Manage Users
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Shipments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.managerSummaries.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No sales data yet
                  </TableCell>
                </TableRow>
              )}
              {data.managerSummaries
                .sort(
                  (a, b) => Number(b.revenue) - Number(a.revenue)
                )
                .map((m, idx) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {fmtINR(m.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmtINR(m.profit)}
                    </TableCell>
                    <TableCell className="text-right">{m.margin}%</TableCell>
                    <TableCell className="text-right">{m.shipments}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Quarter Breakdown ─────────────── */}
      {data.quarterSummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quarter Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quarter</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Shipments</TableHead>
                  <TableHead>Type Breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.quarterSummaries.map((q) => (
                  <TableRow key={q.quarter}>
                    <TableCell className="font-medium">{q.quarter}</TableCell>
                    <TableCell className="text-right">
                      {fmtINR(q.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmtINR(q.profit)}
                    </TableCell>
                    <TableCell className="text-right">{q.shipments}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {Object.entries(q.byType).map(([type, count]) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}: {count}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
