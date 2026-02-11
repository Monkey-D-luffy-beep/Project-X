import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// ══════════════════════════════════════════════
// GET /api/dsr — List DSRs (scoped by role)
// cs_staff: only their own DSRs
// admin: all DSRs
// ══════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  const singleId = req.nextUrl.searchParams.get("id");

  // ── Single DSR fetch ──
  if (singleId) {
    const singleWhere: Record<string, unknown> = { id: singleId };
    if (role === "cs_staff") singleWhere.createdBy = session.user.id;

    const dsr = await prisma.dSR.findFirst({
      where: singleWhere,
      include: { creator: { select: { name: true, email: true } } },
    });
    if (!dsr)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(dsr);
  }

  // ── List DSRs ──
  const status = req.nextUrl.searchParams.get("status"); // "draft" | "sent" | null

  const where: Record<string, unknown> = {};

  // Scope by role
  if (role === "cs_staff") {
    where.createdBy = session.user.id;
  }
  // admin sees all

  // Filter by status
  if (status === "draft") {
    where.sentAt = null;
  } else if (status === "sent") {
    where.sentAt = { not: null };
  }

  const dsrs = await prisma.dSR.findMany({
    where,
    include: {
      creator: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ dsrs });
}

// ══════════════════════════════════════════════
// POST /api/dsr — Create DSR draft
// ══════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "cs_staff" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    sNo,
    trlNo,
    shipperName,
    shippingLine,
    mbl,
    hbl,
    shipmentType,
    cntrQty,
    cntrType,
    pol,
    pod,
    fpod,
    etdPoi,
    etaPod,
    bro,
    broReceived,
    jobStatus,
    clientEmail,
  } = body;

  // Validate required fields
  if (!shipperName || !clientEmail) {
    return NextResponse.json(
      { error: "shipperName and clientEmail are required" },
      { status: 400 }
    );
  }

  const dsr = await prisma.dSR.create({
    data: {
      createdBy: session.user.id,
      sNo: sNo || "",
      trlNo: trlNo || "",
      shipperName,
      shippingLine: shippingLine || "",
      mbl: mbl || "",
      hbl: hbl || "",
      shipmentType: shipmentType || "SEA",
      cntrQty: cntrQty || "",
      cntrType: cntrType || "",
      pol: pol || "",
      pod: pod || "",
      fpod: fpod || "",
      etdPoi: etdPoi ? new Date(etdPoi) : new Date(),
      etaPod: etaPod ? new Date(etaPod) : new Date(),
      bro: bro || "",
      broReceived: broReceived || false,
      jobStatus: jobStatus || "IN TRANSIT",
      clientEmail,
    },
  });

  return NextResponse.json({ dsr }, { status: 201 });
}

// ══════════════════════════════════════════════
// PUT /api/dsr?id=xxx — Update DSR
// ══════════════════════════════════════════════
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Check ownership (cs_staff can only edit their own)
  const existing = await prisma.dSR.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "DSR not found" }, { status: 404 });
  }

  const role = (session.user as { role?: string }).role;
  if (role === "cs_staff" && existing.createdBy !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Can't edit sent DSRs
  if (existing.sentAt) {
    return NextResponse.json(
      { error: "Cannot edit a sent DSR" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  const fields = [
    "sNo", "trlNo", "shipperName", "shippingLine", "mbl", "hbl",
    "shipmentType", "cntrQty", "cntrType", "pol", "pod", "fpod",
    "bro", "jobStatus", "clientEmail",
  ];

  for (const f of fields) {
    if (body[f] !== undefined) updateData[f] = body[f];
  }
  if (body.etdPoi !== undefined) updateData.etdPoi = new Date(body.etdPoi);
  if (body.etaPod !== undefined) updateData.etaPod = new Date(body.etaPod);
  if (body.broReceived !== undefined) updateData.broReceived = body.broReceived;

  const dsr = await prisma.dSR.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ dsr });
}

// ══════════════════════════════════════════════
// DELETE /api/dsr?id=xxx — Delete draft DSR
// ══════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.dSR.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "DSR not found" }, { status: 404 });
  }

  const role = (session.user as { role?: string }).role;
  if (role === "cs_staff" && existing.createdBy !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (existing.sentAt) {
    return NextResponse.json(
      { error: "Cannot delete a sent DSR" },
      { status: 400 }
    );
  }

  await prisma.dSR.delete({ where: { id } });
  return NextResponse.json({ message: "DSR deleted" });
}
