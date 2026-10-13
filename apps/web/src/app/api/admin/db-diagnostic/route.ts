import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/authorization";
import { prisma, checkDatabaseHealth } from "@/lib/db/prisma";
import { databasePoolConfig } from "@/lib/db/database-pool-config.mjs";
import { sanitizeConnectionString, diagnoseDatabaseError } from "@/lib/db/database-error.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول كمسؤول للوصول إلى تقرير فحص قاعدة البيانات." },
      { status: 401 }
    );
  }

  const rawUrl = process.env.DATABASE_URL || "";
  const sanitizedUrl = sanitizeConnectionString(rawUrl);
  let host = "غير محدد";
  let port = "غير محدد";
  let database = "غير محدد";
  try {
    if (rawUrl) {
      const parsed = new URL(rawUrl);
      host = parsed.hostname;
      port = parsed.port || "5432";
      database = parsed.pathname.replace(/^\//, "") || "postgres";
    }
  } catch {}

  const poolConfig = databasePoolConfig();

  // Test live query
  const health = await checkDatabaseHealth();

  if (!health.connected) {
    return NextResponse.json({
      status: "error",
      connected: false,
      latencyMs: health.latencyMs,
      host,
      port,
      database,
      sanitizedConnectionString: sanitizedUrl,
      poolConfig,
      diagnosis: health.error,
    }, { status: 503 });
  }

  // If connected, test table access and counts
  try {
    const [userCount, productCount, orderCount, settingsExist] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.storeSettings.findUnique({ where: { id: "singleton" }, select: { id: true } }),
    ]);

    return NextResponse.json({
      status: "ok",
      connected: true,
      latencyMs: health.latencyMs,
      host,
      port,
      database,
      sanitizedConnectionString: sanitizedUrl,
      poolConfig,
      stats: {
        users: userCount,
        products: productCount,
        orders: orderCount,
        storeSettingsConfigured: Boolean(settingsExist),
      },
      message: "الاتصال بقاعدة البيانات سليم وجميع الجداول جاهزة وتستجيب بنجاح.",
    });
  } catch (tableError) {
    const tableDiagnosis = diagnoseDatabaseError(tableError);
    return NextResponse.json({
      status: "degraded",
      connected: true,
      latencyMs: health.latencyMs,
      host,
      port,
      database,
      sanitizedConnectionString: sanitizedUrl,
      poolConfig,
      warning: "الاتصال المبدئي يعمل ولكن فشل الاستعلام عن بعض الجداول.",
      diagnosis: tableDiagnosis,
    }, { status: 500 });
  }
}
