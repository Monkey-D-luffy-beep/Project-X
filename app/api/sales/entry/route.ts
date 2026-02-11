import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// POST /api/sales/entry — Add a single sales row
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "sales_manager") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    quarter,
    quarterType,
    shipperName,
    quarterLabel,
    teuQty,
    revenueInr,
    profitabilityPct,
    notes,
  } = body;

  if (!quarter || !shipperName || !quarterLabel || revenueInr === undefined) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const rowType = quarterType || "actual";

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

  // Calculate profit
  const revenuePaise = BigInt(Math.round(Number(revenueInr) * 100));
  const profPct = Number(profitabilityPct) || 0;
  const profitPaise = BigInt(Math.round(Number(revenuePaise) * profPct));

  // Get next srNo
  const lastItem = await prisma.shipmentLineItem.findFirst({
    where: { reportId: report.id },
    orderBy: { srNo: "desc" },
  });
  const nextSrNo = (lastItem?.srNo || 0) + 1;

  const lineItem = await prisma.shipmentLineItem.create({
    data: {
      reportId: report.id,
      srNo: nextSrNo,
      shipperName,
      quarterLabel,
      teuQty: String(teuQty || ""),
      revenueInr: revenuePaise,
      profitabilityPct: profPct,
      profitInr: profitPaise,
      rowType,
      notes: notes || null,
    },
  });

  return NextResponse.json({
    message: "Entry added",
    id: lineItem.id,
    srNo: lineItem.srNo,
  });
}

// GET /api/sales/entry — Get own entries
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "sales_manager") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const quarter = searchParams.get("quarter");
  const rowType = searchParams.get("rowType");

  const where: Record<string, unknown> = {
    report: { userId: session.user.id },
  };
  if (quarter) {
    where.report = { ...where.report as object, quarter };
  }
  if (rowType) {
    where.rowType = rowType;
  }

  const items = await prisma.shipmentLineItem.findMany({
    where,
    include: {
      report: {
        select: { quarter: true, quarterType: true },
      },
    },
    orderBy: { srNo: "asc" },
  });

  // Convert BigInt to string for JSON serialization
  const serialized = items.map((item) => ({
    ...item,
    revenueInr: item.revenueInr.toString(),
    profitInr: item.profitInr.toString(),
    profitabilityPct: Number(item.profitabilityPct),
  }));

  return NextResponse.json(serialized);
}

// PUT /api/sales/entry — Update a row (via query param ?id=xxx)
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "sales_manager") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.shipmentLineItem.findUnique({
    where: { id },
    include: { report: { select: { userId: true } } },
  });

  if (!existing || existing.report.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    shipperName,
    teuQty,
    revenueInr,
    profitabilityPct,
    notes,
  } = body;

  const revenuePaise =
    revenueInr !== undefined
      ? BigInt(Math.round(Number(revenueInr) * 100))
      : existing.revenueInr;
  const profPct =
    profitabilityPct !== undefined
      ? Number(profitabilityPct)
      : Number(existing.profitabilityPct);
  const profitPaise = BigInt(Math.round(Number(revenuePaise) * profPct));

  const updated = await prisma.shipmentLineItem.update({
    where: { id },
    data: {
      shipperName: shipperName ?? existing.shipperName,
      teuQty: teuQty !== undefined ? String(teuQty) : existing.teuQty,
      revenueInr: revenuePaise,
      profitabilityPct: profPct,
      profitInr: profitPaise,
      notes: notes !== undefined ? notes : existing.notes,
    },
  });

  return NextResponse.json({
    message: "Updated",
    id: updated.id,
  });
}

// DELETE /api/sales/entry — Delete own row
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "sales_manager") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.shipmentLineItem.findUnique({
    where: { id },
    include: { report: { select: { userId: true } } },
  });

  if (!existing || existing.report.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.shipmentLineItem.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}
