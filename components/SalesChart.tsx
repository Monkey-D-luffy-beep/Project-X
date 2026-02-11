// Sales charts component — Revenue bar, Profit bar, Margin trend line
"use client";

import { useMemo } from "react";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LineItem {
  id: string;
  srNo: number;
  shipperName: string;
  quarterLabel: string;
  teuQty: string;
  revenueInr: string;
  profitabilityPct: number;
  profitInr: string;
  rowType: string;
  notes: string | null;
}

interface SalesChartProps {
  quarter: string;
  items: LineItem[];
}

// Custom tooltip formatter for INR
function formatRupees(val: number): string {
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(1)}Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(1)}L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export default function SalesChart({ quarter, items }: SalesChartProps) {
  // Group by shipper — top 10 by revenue
  const shipperData = useMemo(() => {
    const map = new Map<
      string,
      { revenue: number; profit: number; margin: number; count: number }
    >();

    for (const item of items) {
      const rev = Number(item.revenueInr) / 100; // paise → rupees
      const prof = Number(item.profitInr) / 100;
      const margin = Number(item.profitabilityPct);
      const existing = map.get(item.shipperName);
      if (existing) {
        existing.revenue += rev;
        existing.profit += prof;
        existing.margin =
          (existing.margin * existing.count + margin) /
          (existing.count + 1);
        existing.count += 1;
      } else {
        map.set(item.shipperName, {
          revenue: rev,
          profit: prof,
          margin,
          count: 1,
        });
      }
    }

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "…" : name,
        revenue: Math.round(data.revenue),
        profit: Math.round(data.profit),
        margin: parseFloat((data.margin * 100).toFixed(1)),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Revenue by Shipper */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Shipper — {quarter}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shipperData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                tickFormatter={formatRupees}
                className="text-xs"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                className="text-xs"
              />
              <Tooltip
                formatter={(val) => [formatRupees(Number(val)), "Revenue"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background))",
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Profit by Shipper */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profit by Shipper — {quarter}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shipperData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                tickFormatter={formatRupees}
                className="text-xs"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                className="text-xs"
              />
              <Tooltip
                formatter={(val) => [formatRupees(Number(val)), "Profit"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background))",
                }}
              />
              <Bar dataKey="profit" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Margin % Trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            Profitability Margin % by Shipper — {quarter}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={shipperData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis
                tickFormatter={(v: number) => `${v}%`}
                className="text-xs"
              />
              <Tooltip
                formatter={(val) => [`${Number(val)}%`, "Margin"]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background))",
                }}
              />
              <Bar dataKey="margin" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
