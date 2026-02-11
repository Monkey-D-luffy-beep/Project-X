// TigerOps Seed Script
// Creates initial users: 1 admin, sample sales managers, CS staff
// Run with: pnpm db:seed

import { PrismaClient, Role } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log("🐯 Seeding TigerOps database...");

  // ── Admin ──
  const admin = await prisma.user.upsert({
    where: { email: "admin@tigerops.in" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@tigerops.in",
      passwordHash: hashSync("Admin@123", SALT_ROUNDS),
      role: Role.admin,
      mustChangePassword: false,
    },
  });
  console.log(`  ✅ Admin: ${admin.email}`);

  // ── Sales Managers ──
  const salesManagers = [
    "Rakhi",
    "Aditya",
    "Monia",
    "Akhil",
    "Yash",
    "Sandeep",
    "Naseeb",
    "Anuj",
    "Nitin",
    "Shirshir",
    "Souran",
    "Cubox",
    "Hemant",
    "Pradeep",
  ];

  const managerRecords: Record<string, string> = {}; // name → id

  for (const name of salesManagers) {
    const email = `${name.toLowerCase()}@tigerops.in`;
    const manager = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        passwordHash: hashSync("Tiger@2025", SALT_ROUNDS),
        role: Role.sales_manager,
        mustChangePassword: true,
      },
    });
    managerRecords[name] = manager.id;
    console.log(`  ✅ Sales Manager: ${manager.email}`);
  }

  // ── CS Staff (sample: linked to first few managers) ──
  const csStaff = [
    { name: "CS1 Rakhi", email: "cs1.rakhi@tigerops.in", managerName: "Rakhi" },
    { name: "CS2 Rakhi", email: "cs2.rakhi@tigerops.in", managerName: "Rakhi" },
    {
      name: "CS1 Aditya",
      email: "cs1.aditya@tigerops.in",
      managerName: "Aditya",
    },
  ];

  for (const cs of csStaff) {
    const staff = await prisma.user.upsert({
      where: { email: cs.email },
      update: {},
      create: {
        name: cs.name,
        email: cs.email,
        passwordHash: hashSync("Tiger@2025", SALT_ROUNDS),
        role: Role.cs_staff,
        managerId: managerRecords[cs.managerName],
        mustChangePassword: true,
      },
    });
    console.log(`  ✅ CS Staff: ${staff.email} → linked to ${cs.managerName}`);
  }

  console.log("\n🐯 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
