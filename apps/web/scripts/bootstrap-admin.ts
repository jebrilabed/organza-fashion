import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password-hash.mjs";
import { normalizeAccountPhone } from "../src/lib/auth/phone.mjs";

loadEnv({ path: ".env.local" });

async function main() {
  const phone = normalizeAccountPhone(process.env.ADMIN_BOOTSTRAP_PHONE);
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "";
  delete process.env.ADMIN_BOOTSTRAP_PHONE;
  delete process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!phone || password.length < 8 || password.length > 128) {
    console.error("Admin bootstrap requires a valid ADMIN_BOOTSTRAP_PHONE and an 8–128 character ADMIN_BOOTSTRAP_PASSWORD.");
    process.exitCode = 1;
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Admin bootstrap requires DATABASE_URL in apps/web/.env.local.");
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  let stage = "database lookup";

  try {
    const existingUser = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (existingUser) {
      console.error("Admin bootstrap refused: that phone number already belongs to a user; no account was changed.");
      process.exitCode = 1;
    } else {
      stage = "password hashing";
      const passwordHash = await hashPassword(password);
      stage = "admin account creation";
      await prisma.user.create({
        data: { phone, passwordHash, role: "ADMIN" },
        select: { id: true },
      });
      console.log("Administrator account created.");
    }
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
        ? error.code
        : undefined;
    console.error(
      `Admin bootstrap failed during ${stage}${code ? ` (error code: ${code})` : ""}. Check the database configuration and try again.`,
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch(() => {
  console.error("Admin bootstrap failed. Check the database configuration and try again.");
  process.exitCode = 1;
});
