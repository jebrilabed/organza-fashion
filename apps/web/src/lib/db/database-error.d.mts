export type DatabaseErrorCategory =
  | "AUTH"
  | "NETWORK"
  | "TIMEOUT"
  | "SSL"
  | "POOL"
  | "NOT_FOUND_DB"
  | "RECORD_NOT_FOUND"
  | "CONSTRAINT_UNIQUE"
  | "CONSTRAINT_FOREIGN_KEY"
  | "NOT_NULL"
  | "SCHEMA_ERROR"
  | "TRANSACTION"
  | "CONNECTION_CLOSED"
  | "CONFIG"
  | "UNKNOWN";

export interface DatabaseErrorDiagnosis {
  isDatabaseError: boolean;
  category: DatabaseErrorCategory;
  code: string;
  summary: string;
  detail: string;
  suggestion: string;
  technicalMessage: string;
  formattedMessage: string;
  host?: string;
  fields?: string[];
  table?: string;
}

export function sanitizeConnectionString(connStr?: string | null): string;

export function sanitizeErrorMessage(message?: string | null): string;

export function diagnoseDatabaseError(error: unknown, connectionString?: string): DatabaseErrorDiagnosis;

export function formatDatabaseErrorMessage(error: unknown, fallbackMessage?: string): string;
