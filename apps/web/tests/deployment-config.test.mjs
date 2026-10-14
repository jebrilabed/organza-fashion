import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { checkEnvironment } from "../src/lib/config/environment-readiness.mjs";
import { databasePoolConfig, secureDatabaseConnectionString } from "../src/lib/db/database-pool-config.mjs";

const base = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://user:password@db.example:5432/farasha?sslmode=require",
  AUTH_SECRET: "deployment-test-secret-that-is-long-enough",
};

test("production readiness accepts only a public HTTPS SITE_URL", () => {
  assert.deepEqual(checkEnvironment({ ...base, SITE_URL: "https://shop.example" }), []);
  for (const SITE_URL of [
    "http://shop.example",
    "https://localhost",
    "https://127.0.0.1",
    "https://user:pass@shop.example",
    "https://shop.example/path?query=1",
    "not-a-url",
  ]) {
    assert.ok(checkEnvironment({ ...base, SITE_URL }).some((issue) => issue.startsWith("SITE_URL")), SITE_URL);
  }
});

test("database pool is bounded for serverless and supports safe tuning", () => {
  assert.deepEqual(databasePoolConfig({ VERCEL: "1" }), {
    max: 1,
    connectionTimeoutMillis: 40_000,
    idleTimeoutMillis: 30_000,
    query_timeout: 15_000,
    keepAlive: true,
  });
  assert.equal(databasePoolConfig({ VERCEL: "1", DATABASE_POOL_MAX: "99" }).max, 20);
  assert.equal(databasePoolConfig({ DATABASE_POOL_MAX: "2", DATABASE_CONNECTION_TIMEOUT_MS: "bad" }).max, 2);
  assert.equal(databasePoolConfig({ DATABASE_POOL_MAX: "2", DATABASE_CONNECTION_TIMEOUT_MS: "bad" }).connectionTimeoutMillis, 40_000);
});

test("remote database URLs require TLS and support explicit CA verification", () => {
  const remote = "postgresql://user:password@db.example:5432/store";
  const secured = new URL(secureDatabaseConnectionString(remote, {}));
  assert.equal(secured.searchParams.get("sslmode"), "require");
  assert.equal(secured.searchParams.get("uselibpqcompat"), "true");

  const verified = new URL(secureDatabaseConnectionString(remote, { DATABASE_SSL_ROOT_CERT: "C:/certs/root.crt" }));
  assert.equal(verified.searchParams.get("sslmode"), "verify-full");
  assert.equal(verified.searchParams.get("sslrootcert"), "C:/certs/root.crt");
  assert.throws(() => secureDatabaseConnectionString(remote, { DATABASE_SSL_MODE: "disable" }), /must require TLS/);
  assert.throws(() => secureDatabaseConnectionString(remote, { DATABASE_SSL_MODE: "prefer" }), /must require TLS/);
  assert.equal(secureDatabaseConnectionString("postgresql://user:password@localhost:5432/store", {}), "postgresql://user:password@localhost:5432/store");
  assert.equal(secureDatabaseConnectionString("postgresql://user:password@[::1]:5432/store", {}), "postgresql://user:password@[::1]:5432/store");
});

test("Supabase serverless URLs use the transaction pooler without changing local session URLs", () => {
  const sessionUrl = "postgresql://postgres.project:password@aws-0-region.pooler.supabase.com:5432/postgres";
  const serverless = new URL(secureDatabaseConnectionString(sessionUrl, { VERCEL: "1" }));
  assert.equal(serverless.port, "6543");
  assert.equal(serverless.searchParams.get("pgbouncer"), "true");
  assert.equal(serverless.searchParams.get("sslmode"), "require");

  const local = new URL(secureDatabaseConnectionString(sessionUrl, {}));
  assert.equal(local.port, "5432");
  assert.equal(local.searchParams.has("pgbouncer"), false);
});

test("Vercel uses the monorepo root and generates Prisma Client before building", async () => {
  const config = JSON.parse(await readFile(new URL("../../../vercel.json", import.meta.url), "utf8"));
  assert.equal(config.framework, "nextjs");
  assert.equal(config.installCommand, "npm ci");
  assert.match(config.buildCommand, /db:generate.*npm run build/);
});

test("AI container binds to the platform port and excludes local environment files", async () => {
  const dockerfile = await readFile(new URL("../../ai/Dockerfile", import.meta.url), "utf8");
  const ignore = await readFile(new URL("../../ai/.dockerignore", import.meta.url), "utf8");
  assert.match(dockerfile, /python:3\.12-slim/);
  assert.match(dockerfile, /USER farasha/);
  assert.match(dockerfile, /\$\{PORT:-\$\{AI_PORT:-8000\}\}/);
  assert.match(ignore, /^\.env\.\*$/m);
});
