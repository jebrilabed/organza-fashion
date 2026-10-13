import assert from "node:assert/strict";
import { test } from "node:test";
import {
  diagnoseDatabaseError,
  formatDatabaseErrorMessage,
  sanitizeConnectionString,
  sanitizeErrorMessage,
} from "../src/lib/db/database-error.mjs";

test("sanitizeConnectionString redacts passwords safely", () => {
  const url = "postgresql://myuser:supersecret123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require";
  const sanitized = sanitizeConnectionString(url);
  assert.equal(sanitized, "postgresql://myuser:***@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require");
  assert.equal(sanitized.includes("supersecret123"), false);
});

test("sanitizeErrorMessage scrubs credentials from error strings", () => {
  const msg = 'Connection failed: postgresql://admin:pass999@localhost:5432/db with password="secret"';
  const sanitized = sanitizeErrorMessage(msg);
  assert.equal(sanitized.includes("pass999"), false);
  assert.equal(sanitized.includes("secret"), false);
});

test("diagnoses P1000 and 28P01 as AUTH with actionable Arabic guidance", () => {
  const err = { code: "P1000", message: "Authentication failed against database server" };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.isDatabaseError, true);
  assert.equal(diagnosis.category, "AUTH");
  assert.equal(diagnosis.code, "P1000");
  assert.ok(diagnosis.formattedMessage.includes("بيانات دخول"));
  assert.ok(diagnosis.suggestion.includes("DATABASE_URL"));

  const pgErr = { code: "28P01", message: "password authentication failed for user 'postgres'" };
  const pgDiag = diagnoseDatabaseError(pgErr);
  assert.equal(pgDiag.category, "AUTH");
});

test("diagnoses P1001 and ENOTFOUND as NETWORK with Supabase paused and connectivity tips", () => {
  const err = {
    code: "P1001",
    message: "Can't reach database server at aws-0-ap-south-1.pooler.supabase.com",
    meta: { database_host: "aws-0-ap-south-1.pooler.supabase.com" },
  };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.isDatabaseError, true);
  assert.equal(diagnosis.category, "NETWORK");
  assert.ok(diagnosis.detail.includes("Supabase"));
  assert.ok(diagnosis.detail.includes("Paused"));
  assert.ok(diagnosis.formattedMessage.includes("aws-0-ap-south-1.pooler.supabase.com"));
});

test("diagnoses P1002 and ETIMEDOUT as TIMEOUT", () => {
  const err = { code: "P1002", message: "The database server was reached, but timed out" };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.category, "TIMEOUT");
  assert.ok(diagnosis.summary.includes("مهلة"));
});

test("diagnoses P1011 and SSL errors as SSL", () => {
  const err = { code: "P1011", message: "Error opening a TLS connection: self-signed certificate in certificate chain" };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.category, "SSL");
  assert.ok(diagnosis.summary.includes("TLS/SSL"));
});

test("diagnoses P2024 and 53300 as POOL exhaustion", () => {
  const err = { code: "P2024", message: "Timed out fetching a new connection from the connection pool" };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.category, "POOL");
  assert.ok(diagnosis.summary.includes("تجمع"));
});

test("diagnoses P2002 and 23505 as CONSTRAINT_UNIQUE with target fields", () => {
  const err = {
    code: "P2002",
    message: "Unique constraint failed on the fields: (`slug`)",
    meta: { target: ["slug"] },
  };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.category, "CONSTRAINT_UNIQUE");
  assert.deepEqual(diagnosis.fields, ["slug"]);
  assert.ok(diagnosis.formattedMessage.includes("slug"));
  assert.ok(diagnosis.formattedMessage.includes("مكررة"));
});

test("diagnoses P2003 as CONSTRAINT_FOREIGN_KEY with relation field", () => {
  const err = {
    code: "P2003",
    message: "Foreign key constraint failed on the field: `categoryId`",
    meta: { field_name: "categoryId" },
  };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.category, "CONSTRAINT_FOREIGN_KEY");
  assert.ok(diagnosis.formattedMessage.includes("categoryId"));
});

test("diagnoses P2025 as RECORD_NOT_FOUND", () => {
  const err = { code: "P2025", message: "Record to update not found." };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.category, "RECORD_NOT_FOUND");
  assert.ok(diagnosis.summary.includes("غير موجود"));
});

test("diagnoses P2021 as SCHEMA_ERROR pointing to migration deploy", () => {
  const err = { code: "P2021", message: "The table `public.order` does not exist in the current database." };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.category, "SCHEMA_ERROR");
  assert.ok(diagnosis.suggestion.includes("db:migrate:deploy"));
});

test("diagnoses P1017 and ECONNRESET as CONNECTION_CLOSED", () => {
  const err = { code: "P1017", message: "Server has closed the connection." };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.category, "CONNECTION_CLOSED");
});

test("diagnoses P2028 startup timeout with specific pool contention guidance", () => {
  const err = { code: "P2028", message: "Transaction API error: Unable to start a transaction in the given time." };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.category, "TRANSACTION");
  assert.ok(diagnosis.summary.includes("مهلة بدء المعاملة"));
  assert.ok(diagnosis.detail.includes("تجمع الاتصالات"));
});

test("diagnoses P2028 execution timeout with specific timeout explanation", () => {
  const err = { code: "P2028", message: "Transaction API error: Transaction already closed: A query cannot be executed on a closed transaction." };
  const diagnosis = diagnoseDatabaseError(err);
  assert.equal(diagnosis.category, "TRANSACTION");
  assert.ok(diagnosis.summary.includes("مهلة تنفيذ المعاملة"));
});

test("formatDatabaseErrorMessage formats detailed Arabic error if database error", () => {
  const err = { code: "P1001", message: "Can't reach database server" };
  const msg = formatDatabaseErrorMessage(err, "خطأ عام");
  assert.notEqual(msg, "خطأ عام");
  assert.ok(msg.includes("P1001"));
  assert.ok(msg.includes("تعذر الاتصال بخادم قاعدة البيانات"));
});

test("formatDatabaseErrorMessage falls back if not database error", () => {
  const err = new Error("Something else failed");
  const msg = formatDatabaseErrorMessage(err, "الرجاء المحاولة لاحقاً");
  assert.equal(msg, "الرجاء المحاولة لاحقاً");
});
