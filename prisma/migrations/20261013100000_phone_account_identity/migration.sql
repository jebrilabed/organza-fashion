-- Phone numbers become the account identity. Existing customer numbers are
-- copied only when the normalized number is valid and belongs to one user.
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

WITH candidates AS (
  SELECT
    c."userId",
    regexp_replace(
      translate(trim(c."phone"), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'),
      '[^0-9]',
      '',
      'g'
    ) AS phone
  FROM "customers" c
  WHERE c."userId" IS NOT NULL AND c."phone" IS NOT NULL
), valid_candidates AS (
  SELECT "userId", phone
  FROM candidates
  WHERE length(phone) BETWEEN 8 AND 15
), unique_numbers AS (
  SELECT phone
  FROM valid_candidates
  GROUP BY phone
  HAVING count(*) = 1
)
UPDATE "users" u
SET "phone" = candidate.phone
FROM valid_candidates candidate
JOIN unique_numbers unique_number ON unique_number.phone = candidate.phone
WHERE u."id" = candidate."userId";

CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
