import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import DSRTemplate from "@/emails/dsr-template";

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/dsr/send — Send DSR email via Resend
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "cs_staff" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { dsrId } = await req.json();
  if (!dsrId) {
    return NextResponse.json({ error: "dsrId is required" }, { status: 400 });
  }

  const dsr = await prisma.dSR.findUnique({
    where: { id: dsrId },
    include: { creator: { select: { name: true } } },
  });

  if (!dsr) {
    return NextResponse.json({ error: "DSR not found" }, { status: 404 });
  }

  if (dsr.sentAt) {
    return NextResponse.json(
      { error: "DSR already sent" },
      { status: 400 }
    );
  }

  // Check ownership for cs_staff
  if (role === "cs_staff" && dsr.createdBy !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_xxxxxxxxxxxx") {
    // Mark as sent even without real email (dev mode)
    await prisma.dSR.update({
      where: { id: dsrId },
      data: { sentAt: new Date() },
    });
    return NextResponse.json({
      message: "DSR marked as sent (email sending skipped — no API key configured)",
      devMode: true,
    });
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "noreply@tigerops.in",
      to: dsr.clientEmail,
      subject: `Daily Shipment Report — ${dsr.shipperName} | ${dsr.pol} → ${dsr.pod}`,
      react: DSRTemplate({
        sNo: dsr.sNo,
        trlNo: dsr.trlNo,
        shipperName: dsr.shipperName,
        shippingLine: dsr.shippingLine,
        mbl: dsr.mbl,
        hbl: dsr.hbl,
        shipmentType: dsr.shipmentType,
        cntrQty: dsr.cntrQty,
        cntrType: dsr.cntrType,
        pol: dsr.pol,
        pod: dsr.pod,
        fpod: dsr.fpod,
        etdPoi: dsr.etdPoi.toISOString().split("T")[0],
        etaPod: dsr.etaPod.toISOString().split("T")[0],
        bro: dsr.bro,
        broReceived: dsr.broReceived,
        jobStatus: dsr.jobStatus,
        creatorName: dsr.creator.name,
      }),
    });

    if (error) {
      return NextResponse.json(
        { error: `Email failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Mark as sent
    await prisma.dSR.update({
      where: { id: dsrId },
      data: { sentAt: new Date() },
    });

    return NextResponse.json({ message: "DSR sent successfully" });
  } catch (err) {
    return NextResponse.json(
      { error: `Send failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
