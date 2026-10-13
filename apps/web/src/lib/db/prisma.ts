import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databasePoolConfig, secureDatabaseConnectionString } from "./database-pool-config.mjs";
import { diagnoseDatabaseError } from "./database-error.mjs";

const globalForPrisma = globalThis as typeof globalThis & {
  farashaPrisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set before database access.");
  }

  const adapter = new PrismaPg({ connectionString: secureDatabaseConnectionString(connectionString), ...databasePoolConfig() }, {
    onPoolError(error) {
      const diagnosis = diagnoseDatabaseError(error, connectionString);
      console.error("PostgreSQL connection pool error:", {
        code: diagnosis.code,
        category: diagnosis.category,
        summary: diagnosis.summary,
        detail: diagnosis.detail,
        technicalMessage: diagnosis.technicalMessage,
      });
    },
  });
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  globalForPrisma.farashaPrisma ??= createPrismaClient();
  return globalForPrisma.farashaPrisma;
}

// Auth.js and statically built server routes can import the adapter before a
// request needs PostgreSQL. Resolve the connection lazily on first database use.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    if (property === "$transaction") {
      return async function (arg1: unknown, arg2?: unknown) {
        if (typeof arg1 === "function") {
          const userOpts = typeof arg2 === "object" && arg2 !== null ? arg2 : {};
          const safeOpts = {
            maxWait: 15_000,
            timeout: 30_000,
            ...userOpts,
          };
          type TxMethod = (...args: unknown[]) => unknown;
          try {
            return await (client.$transaction as TxMethod)(arg1, safeOpts);
          } catch (firstError: unknown) {
            const errObj = typeof firstError === "object" && firstError !== null ? (firstError as Record<string, unknown>) : {};
            const code = String(errObj.code || errObj.errorCode || "");
            const msg = String(errObj.message || "");
            if (code === "P2028" || code === "P2034" || msg.includes("Unable to start a transaction") || msg.includes("deadlock")) {
              console.warn("Retrying interactive transaction after transient concurrency/P2028 timeout...", { code });
              await new Promise((r) => setTimeout(r, 300));
              return await (client.$transaction as TxMethod)(arg1, {
                ...safeOpts,
                maxWait: 20_000,
                timeout: 35_000,
              });
            }
            throw firstError;
          }
        }
        return (client.$transaction as (...args: unknown[]) => unknown)(arg1, arg2);
      };
    }
    return Reflect.get(client, property, client);
  },
});

export async function checkDatabaseHealth() {
  const start = Date.now();
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return {
      connected: true as const,
      latencyMs,
      error: null,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const diagnosis = diagnoseDatabaseError(error, process.env.DATABASE_URL);
    return {
      connected: false as const,
      latencyMs,
      error: diagnosis,
    };
  }
}

