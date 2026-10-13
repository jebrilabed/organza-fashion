import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { normalizeAccountPhone } from "../src/lib/auth/phone.mjs";

loadEnv({ path: ".env.local" });

async function main() {
  const requestedPhone = process.env.ADMIN_ACCOUNT_PHONE ?? "";
  const accountEmail = process.env.ADMIN_ACCOUNT_EMAIL?.trim() ?? "";
  delete process.env.ADMIN_ACCOUNT_PHONE;
  delete process.env.ADMIN_ACCOUNT_EMAIL;

  const phone = normalizeAccountPhone(requestedPhone);
  if (!phone || (accountEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail))) {
    console.error("Provide a valid ADMIN_ACCOUNT_PHONE and, if needed, a valid ADMIN_ACCOUNT_EMAIL.");
    process.exitCode = 1;
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Admin phone update requires DATABASE_URL in apps/web/.env.local.");
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  let stage = "administrator lookup";

  try {
    const select = { id: true, email: true, phone: true, role: true, passwordHash: true } as const;
    let admin;
    if (accountEmail) {
      const matchedUser = await prisma.user.findUnique({ where: { email: accountEmail }, select });
      if (!matchedUser || matchedUser.role !== "ADMIN") {
        console.error("No administrator account matched that email; no account was changed.");
        process.exitCode = 1;
        return;
      }
      admin = matchedUser;
    } else {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select, take: 2 });
      if (admins.length !== 1) {
        console.error("Could not identify exactly one administrator; set ADMIN_ACCOUNT_EMAIL to select the existing account.");
        process.exitCode = 1;
        return;
      }
      admin = admins[0];
    }

    if (!admin.passwordHash) {
      console.error("The administrator has no password credential; no account was changed.");
      process.exitCode = 1;
      return;
    }
    if (admin.phone === phone) {
      console.log("The administrator already uses that phone number.");
      return;
    }

    const phoneOwner = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (phoneOwner && phoneOwner.id !== admin.id) {
      console.error("That phone number already belongs to another account; no account was changed.");
      process.exitCode = 1;
      return;
    }

    stage = "administrator phone update";
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: {
          id: admin.id,
          role: "ADMIN",
          email: admin.email,
          phone: admin.phone,
          passwordHash: admin.passwordHash,
        },
        data: { phone },
      });
      if (result.count !== 1) return false;

      await tx.adminAuditLog.create({
        data: {
          actorUserId: admin.id,
          action: "auth.admin-phone.update",
          entityType: "User",
          entityId: admin.id,
          metadata: { changedFields: ["phone"] },
        },
      });
      return true;
    });

    if (!updated) {
      console.error("The administrator account changed during the update; no phone number was changed.");
      process.exitCode = 1;
      return;
    }
    console.log("Administrator phone updated. Sign in with the new phone and existing password.");
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
        ? error.code
        : undefined;
    console.error(
      code === "P2002"
        ? "That phone number already belongs to another account; no account was changed."
        : `Admin phone update failed during ${stage}${code ? ` (error code: ${code})` : ""}. Check the database configuration and try again.`,
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch(() => {
  console.error("Admin phone update failed. Check the database configuration and try again.");
  process.exitCode = 1;
});