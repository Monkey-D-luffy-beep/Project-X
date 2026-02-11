import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// ── Guard: admin only ────────────────────────
async function adminGuard() {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role !== "admin") {
    return null;
  }
  return session;
}

// ══════════════════════════════════════════════
// GET /api/admin/users — List all users
// ══════════════════════════════════════════════
export async function GET() {
  if (!(await adminGuard())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
      createdAt: true,
      _count: { select: { reports: true, dsrs: true, staff: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ users });
}

// ══════════════════════════════════════════════
// POST /api/admin/users — Create a new user
// ══════════════════════════════════════════════
export async function POST(req: NextRequest) {
  if (!(await adminGuard())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, password, role, managerId } = body as {
    name: string;
    email: string;
    password: string;
    role: string;
    managerId?: string;
  };

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "name, email, password and role are required" },
      { status: 400 }
    );
  }

  // Check duplicate
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role as "admin" | "sales_manager" | "cs_staff",
      managerId: managerId || null,
      mustChangePassword: true,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}

// ══════════════════════════════════════════════
// PUT /api/admin/users?id=xxx — Update a user
// ══════════════════════════════════════════════
export async function PUT(req: NextRequest) {
  if (!(await adminGuard())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const body = await req.json();
  const { name, email, role, isActive, managerId, mustChangePassword, newPassword } =
    body as {
      name?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
      managerId?: string | null;
      mustChangePassword?: boolean;
      newPassword?: string;
    };

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email.toLowerCase();
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (managerId !== undefined) updateData.managerId = managerId || null;
  if (mustChangePassword !== undefined)
    updateData.mustChangePassword = mustChangePassword;
  if (newPassword) {
    updateData.passwordHash = bcrypt.hashSync(newPassword, 10);
    updateData.mustChangePassword = true;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

// ══════════════════════════════════════════════
// DELETE /api/admin/users?id=xxx — Deactivate (soft-delete)
// ══════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
  if (!(await adminGuard())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true },
    });
    return NextResponse.json({ message: `${user.name} deactivated` });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
