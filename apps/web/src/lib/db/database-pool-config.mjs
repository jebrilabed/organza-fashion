function boundedInteger(value, fallback, minimum, maximum) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Number(value)));
}

export function databasePoolConfig(env = process.env) {
  const serverless = Boolean(env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME);
  return {
    max: boundedInteger(env.DATABASE_POOL_MAX, serverless ? 1 : 10, 1, 20),
    // Wait longer than the longest interactive transaction so queued queries
    // can reuse the connection once that transaction finishes or times out.
    connectionTimeoutMillis: boundedInteger(env.DATABASE_CONNECTION_TIMEOUT_MS, 40_000, 1_000, 60_000),
    idleTimeoutMillis: boundedInteger(env.DATABASE_IDLE_TIMEOUT_MS, 30_000, 5_000, 300_000),
    query_timeout: boundedInteger(env.DATABASE_QUERY_TIMEOUT_MS, 15_000, 1_000, 120_000),
    keepAlive: true,
  };
}

export function secureDatabaseConnectionString(connectionString, env = process.env) {
  const url = new URL(connectionString);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(host);
  const serverless = Boolean(env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME);
  if (serverless && host.endsWith(".pooler.supabase.com") && url.port === "5432") {
    url.port = "6543";
    url.searchParams.set("pgbouncer", "true");
  }
  const rootCertificatePath = env.DATABASE_SSL_ROOT_CERT?.trim() || url.searchParams.get("sslrootcert");
  const requestedMode = env.DATABASE_SSL_MODE?.trim() || url.searchParams.get("sslmode") || (rootCertificatePath ? "verify-full" : "require");
  const supportedModes = new Set(["disable", "prefer", "require", "verify-ca", "verify-full"]);
  if (!supportedModes.has(requestedMode)) throw new Error("DATABASE_SSL_MODE must be a supported PostgreSQL SSL mode.");
  if (!localHost && ["disable", "prefer"].includes(requestedMode)) throw new Error("Remote PostgreSQL connections must require TLS.");
  if (localHost && !env.DATABASE_SSL_MODE && !url.searchParams.has("sslmode") && !rootCertificatePath) return connectionString;
  if (rootCertificatePath) url.searchParams.set("sslrootcert", rootCertificatePath);
  url.searchParams.set("sslmode", requestedMode);
  url.searchParams.set("uselibpqcompat", "true");
  return url.toString();
}
