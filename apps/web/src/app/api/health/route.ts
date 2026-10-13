import { checkEnvironment } from "@/lib/config/environment-readiness.mjs";
import { checkDatabaseHealth } from "@/lib/db/prisma";
import { diagnoseDatabaseError } from "@/lib/db/database-error.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const issues = checkEnvironment();
  const databaseConfigurationIssues = issues.filter((issue) => issue.startsWith("DATABASE_URL"));
  let database = process.env.DATABASE_URL ? "unavailable" : "not-configured";
  let databaseDiagnosis: ReturnType<typeof diagnoseDatabaseError> | null = null;
  let databaseLatencyMs: number | undefined;

  if (process.env.DATABASE_URL && databaseConfigurationIssues.length === 0) {
    const health = await checkDatabaseHealth();
    databaseLatencyMs = health.latencyMs;
    if (health.connected) {
      database = "connected";
    } else {
      database = "unavailable";
      databaseDiagnosis = health.error;
      console.error("Database readiness probe failed.", {
        code: databaseDiagnosis?.code,
        category: databaseDiagnosis?.category,
        summary: databaseDiagnosis?.summary,
        detail: databaseDiagnosis?.detail,
      });
    }
  } else if (!process.env.DATABASE_URL) {
    databaseDiagnosis = diagnoseDatabaseError(new Error("DATABASE_URL must be set before database access."));
  }

  const ready = issues.length === 0 && database === "connected";
  const reportedIssues = database === "unavailable"
    ? [
        ...issues,
        databaseDiagnosis
          ? `${databaseDiagnosis.formattedMessage}`
          : "DATABASE_URL is configured but PostgreSQL is unreachable.",
      ]
    : issues;

  return Response.json({
    service: "web",
    status: ready ? "ok" : "not-ready",
    readiness: ready ? "ready" : database === "unavailable" ? "database-unavailable" : "environment-incomplete",
    checks: {
      application: "ok",
      database,
      databaseLatencyMs,
      databaseDiagnosis: databaseDiagnosis ? {
        category: databaseDiagnosis.category,
        code: databaseDiagnosis.code,
        summary: databaseDiagnosis.summary,
        detail: databaseDiagnosis.detail,
        suggestion: databaseDiagnosis.suggestion,
        technicalMessage: databaseDiagnosis.technicalMessage,
      } : null,
      auth: process.env.AUTH_SECRET ? "configured" : "not-configured",
    },
    issues: reportedIssues,
  }, { status: ready ? 200 : 503 });
}

