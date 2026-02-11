import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { RowType } from "@prisma/client";

interface ImportRow {
  shipperName: string;
  quarterLabel: string;
  teuQty: string;
  revenueInr: number; // In rupees (will be converted to paise)
  profitabilityPct: number; // Decimal, e.g. 0.16 = 16%
  notes?: string;
  _hasError?: boolean;
  _errorMsg?: string;
}

// POST /api/sales/import — Batch import from Excel
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "sales_manager") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    rows,
    quarter,
    quarterType,
  }: {
    rows: ImportRow[];
    quarter: string;
    quarterType: string;
  } = body;

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }

  if (!quarter) {
    return NextResponse.json(
      { error: "Quarter is required" },
      { status: 400 }
    );
  }

  const rowType = (quarterType as RowType) || "actual";

  // Find or create the QuarterlyReport
  const report = await prisma.quarterlyReport.upsert({
    where: {
      userId_quarter_quarterType: {
        userId: session.user.id,
        quarter,
        quarterType: rowType,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      quarter,
      quarterType: rowType,
    },
  });

  // Get current max srNo
  const lastItem = await prisma.shipmentLineItem.findFirst({
    where: { reportId: report.id },
    orderBy: { srNo: "desc" },
  });
  let nextSrNo = (lastItem?.srNo || 0) + 1;

  const imported: string[] = [];
  const skipped: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Skip rows that had errors flagged by frontend
    if (row._hasError) {
      skipped.push({ row: i + 1, reason: row._errorMsg || "Flagged error" });
      continue;
    }

    // Validate
    if (!row.shipperName || row.shipperName.trim() === "") {
      skipped.push({ row: i + 1, reason: "Missing shipper name" });
      continue;
    }

    const revenue = Number(row.revenueInr) || 0;
    if (revenue === 0) {
      skipped.push({ row: i + 1, reason: "Revenue is zero" });
      continue;
    }

    const profPct = Number(row.profitabilityPct) || 0;
    if (profPct > 1) {
      skipped.push({
        row: i + 1,
        reason: `Profitability ${(profPct * 100).toFixed(0)}% exceeds 100%`,
      });
      continue;
    }

    const revenuePaise = BigInt(Math.round(revenue * 100));
    const profitPaise = BigInt(Math.round(Number(revenuePaise) * profPct));

    await prisma.shipmentLineItem.create({
      data: {
        reportId: report.id,
        srNo: nextSrNo++,
        shipperName: row.shipperName.trim(),
        quarterLabel: row.quarterLabel || quarter,
        teuQty: String(row.teuQty || ""),
        revenueInr: revenuePaise,
        profitabilityPct: profPct,
        profitInr: profitPaise,
        rowType,
        notes: row.notes || null,
      },
    });

    imported.push(row.shipperName.trim());
  }

  return NextResponse.json({
    message: `Import complete`,
    imported: imported.length,
    skipped: skipped.length,
    skippedDetails: skipped,
    total: rows.length,
  });
}
