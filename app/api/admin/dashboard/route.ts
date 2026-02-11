import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/admin/dashboard — Aggregated quarterly data for admin overview
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── User counts ──────────────────
  const userCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: { id: true },
    where: { isActive: true },
  });
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({ where: { isActive: true } });

  // ── Overall revenue & profit ─────
  const totals = await prisma.shipmentLineItem.aggregate({
    _sum: { revenueInr: true, profitInr: true },
    _count: { id: true },
  });

  // ── By quarter ───────────────────
  const quarterlyReports = await prisma.quarterlyReport.findMany({
    include: {
      user: { select: { name: true } },
      lineItems: {
        select: { revenueInr: true, profitInr: true, profitabilityPct: true },
      },
    },
    orderBy: { quarter: "desc" },
  });

  // Aggregate per quarter
  const quarterMap = new Map<
    string,
    { revenue: bigint; profit: bigint; count: number; types: Record<string, number> }
  >();
  for (const report of quarterlyReports) {
    const key = report.quarter;
    const existing = quarterMap.get(key) || {
      revenue: BigInt(0),
      profit: BigInt(0),
      count: 0,
      types: {} as Record<string, number>,
    };
    for (const item of report.lineItems) {
      existing.revenue += item.revenueInr;
      existing.profit += item.profitInr;
      existing.count += 1;
    }
    existing.types[report.quarterType] =
      (existing.types[report.quarterType] || 0) + report.lineItems.length;
    quarterMap.set(key, existing);
  }

  const quarterSummaries = Array.from(quarterMap.entries()).map(
    ([quarter, data]) => ({
      quarter,
      revenue: data.revenue.toString(),
      profit: data.profit.toString(),
      shipments: data.count,
      byType: data.types,
    })
  );

  // ── Per-manager summary ──────────
  const managers = await prisma.user.findMany({
    where: { role: "sales_manager", isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      reports: {
        include: {
          lineItems: {
            select: { revenueInr: true, profitInr: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const managerSummaries = managers.map((m) => {
    let revenue = BigInt(0);
    let profit = BigInt(0);
    let shipments = 0;
    for (const report of m.reports) {
      for (const item of report.lineItems) {
        revenue += item.revenueInr;
        profit += item.profitInr;
        shipments += 1;
      }
    }
    return {
      id: m.id,
      name: m.name,
      email: m.email,
      revenue: revenue.toString(),
      profit: profit.toString(),
      shipments,
      margin:
        revenue > BigInt(0)
          ? ((Number(profit) / Number(revenue)) * 100).toFixed(1)
          : "0.0",
    };
  });

  // ── DSR stats ────────────────────
  const totalDsrs = await prisma.dSR.count();
  const sentDsrs = await prisma.dSR.count({ where: { sentAt: { not: null } } });
  const draftDsrs = totalDsrs - sentDsrs;

  return NextResponse.json({
    users: {
      total: totalUsers,
      active: activeUsers,
      byRole: userCounts.map((g) => ({ role: g.role, count: g._count.id })),
    },
    totals: {
      revenue: (totals._sum.revenueInr || BigInt(0)).toString(),
      profit: (totals._sum.profitInr || BigInt(0)).toString(),
      shipments: totals._count.id,
    },
    quarterSummaries,
    managerSummaries,
    dsrs: { total: totalDsrs, sent: sentDsrs, drafts: draftDsrs },
  });
}
