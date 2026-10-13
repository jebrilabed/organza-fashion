/**
 * @file database-error.mjs
 * Comprehensive diagnostic engine for database errors across Prisma, Node-postgres (pg),
 * network drivers, and SSL/TLS handshakes.
 */

/**
 * Removes sensitive credentials from database connection strings.
 * @param {string | undefined | null} connStr 
 * @returns {string}
 */
export function sanitizeConnectionString(connStr) {
  if (!connStr || typeof connStr !== "string") return "";
  return connStr.replace(/(:\/\/[^:]+:)[^@]+(@)/g, "$1***$2");
}

/**
 * Redacts potential credentials, URLs with passwords, or secrets from error messages.
 * @param {string | undefined | null} message 
 * @returns {string}
 */
export function sanitizeErrorMessage(message) {
  if (!message || typeof message !== "string") return "";
  let clean = message.replace(/(:\/\/[^:]+:)[^@]+(@)/g, "$1***$2");
  clean = clean.replace(/password="[^"]+"/gi, 'password="***"');
  clean = clean.replace(/password:\s*'[^']+'/gi, "password: '***'");
  return clean.trim();
}

/**
 * Extracts host information from an error or connection string.
 * @param {unknown} error 
 * @param {string} [connectionString]
 * @returns {string | undefined}
 */
function extractHost(error, connectionString) {
  if (error && typeof error === "object") {
    if ("meta" in error && error.meta && typeof error.meta === "object") {
      const meta = /** @type {Record<string, unknown>} */ (error.meta);
      if (typeof meta.database_host === "string") return meta.database_host;
    }
  }
  const source = connectionString || (typeof process !== "undefined" ? process.env?.DATABASE_URL : "");
  if (source && typeof source === "string") {
    try {
      const parsed = new URL(source);
      return parsed.hostname;
    } catch {}
  }
  return undefined;
}

/**
 * Extracts target fields involved in constraint violations (e.g. P2002).
 * @param {unknown} error 
 * @returns {string[]}
 */
function extractConstraintFields(error) {
  if (!error || typeof error !== "object") return [];
  const rec = /** @type {Record<string, unknown>} */ (error);
  if (rec.meta && typeof rec.meta === "object") {
    const meta = /** @type {Record<string, unknown>} */ (rec.meta);
    if (Array.isArray(meta.target)) return meta.target.map(String);
    if (typeof meta.target === "string") return [meta.target];
    if (typeof meta.field_name === "string") return [meta.field_name];
  }
  return [];
}

/**
 * Analyzes any error object to determine if it relates to database operations
 * and extracts deep technical diagnostics in clear Arabic.
 * 
 * @param {unknown} error 
 * @param {string} [connectionString]
 * @returns {{
 *   isDatabaseError: boolean;
 *   category: "AUTH" | "NETWORK" | "TIMEOUT" | "SSL" | "POOL" | "NOT_FOUND_DB" | "RECORD_NOT_FOUND" | "CONSTRAINT_UNIQUE" | "CONSTRAINT_FOREIGN_KEY" | "NOT_NULL" | "SCHEMA_ERROR" | "TRANSACTION" | "CONNECTION_CLOSED" | "CONFIG" | "UNKNOWN";
 *   code: string;
 *   summary: string;
 *   detail: string;
 *   suggestion: string;
 *   technicalMessage: string;
 *   formattedMessage: string;
 *   host?: string;
 *   fields?: string[];
 *   table?: string;
 * }}
 */
export function diagnoseDatabaseError(error, connectionString) {
  if (!error) {
    return {
      isDatabaseError: false,
      category: "UNKNOWN",
      code: "NO_ERROR",
      summary: "لا يوجد خطأ",
      detail: "العملية تمت بنجاح.",
      suggestion: "",
      technicalMessage: "",
      formattedMessage: "العملية تمت بنجاح.",
    };
  }

  const errorObj = typeof error === "object" && error !== null ? /** @type {Record<string, unknown>} */ (error) : {};
  const cause = errorObj.cause && typeof errorObj.cause === "object" ? /** @type {Record<string, unknown>} */ (errorObj.cause) : {};
  const cause2 = cause.cause && typeof cause.cause === "object" ? /** @type {Record<string, unknown>} */ (cause.cause) : {};

  // Find error code
  const code = String(
    errorObj.code ||
    errorObj.errorCode ||
    cause.code ||
    cause2.code ||
    ""
  ).trim();

  // Find raw message
  const rawMsg = String(
    errorObj.message ||
    cause.message ||
    cause2.message ||
    String(error)
  );
  const technicalMessage = sanitizeErrorMessage(rawMsg);
  const lowerMsg = technicalMessage.toLowerCase();
  const host = extractHost(error, connectionString);
  const fields = extractConstraintFields(error);

  const isPrisma = Boolean(
    errorObj.name === "PrismaClientKnownRequestError" ||
    errorObj.name === "PrismaClientInitializationError" ||
    errorObj.name === "PrismaClientRustPanicError" ||
    errorObj.name === "PrismaClientUnknownRequestError" ||
    errorObj.name === "PrismaClientValidationError" ||
    code.startsWith("P1") ||
    code.startsWith("P2")
  );

  const isPgDriver = Boolean(
    cause.routine ||
    cause.severity ||
    ["28P01", "28000", "3D000", "23505", "23503", "23502", "42P01", "42703", "53300", "57P01", "57014", "40P01", "40001", "08006", "08001"].includes(code)
  );

  const isNetwork = Boolean(
    ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "EHOSTUNREACH"].includes(code) ||
    lowerMsg.includes("getaddrinfo") ||
    lowerMsg.includes("connection refused") ||
    lowerMsg.includes("can't reach database server")
  );

  const isConfig = lowerMsg.includes("database_url must be set") || lowerMsg.includes("database_url must use postgresql");

  const isDatabaseError = isPrisma || isPgDriver || isNetwork || isConfig;

  // 1. Authentication / Credentials
  if (code === "P1000" || code === "28P01" || code === "28000" || lowerMsg.includes("password authentication failed") || lowerMsg.includes("credentials are not valid")) {
    const detail = `فشل التحقق من بيانات الدخول إلى قاعدة البيانات. خادم PostgreSQL رفض اسم المستخدم أو كلمة المرور${host ? ` على الخادم (${host})` : ""}.`;
    const suggestion = "يرجى التحقق من صحة كلمة المرور واسم المستخدم في متغير DATABASE_URL داخل ملف .env.local أو لوحة تحكم Supabase.";
    return {
      isDatabaseError: true,
      category: "AUTH",
      code: code || "P1000",
      summary: "فشل التحقق من بيانات الدخول (اسم المستخدم أو كلمة المرور)",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `خطأ في بيانات دخول قاعدة البيانات [رمز: ${code || "P1000"}]: ${detail} ${suggestion}`,
      host,
    };
  }

  // 2. Network / Unreachable Host / Supabase Paused
  if (
    code === "P1001" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "ECONNREFUSED" ||
    code === "EHOSTUNREACH" ||
    lowerMsg.includes("can't reach database server") ||
    lowerMsg.includes("getaddrinfo") ||
    lowerMsg.includes("connection refused")
  ) {
    const detail = `تعذر الوصول إلى خادم قاعدة البيانات${host ? ` (${host})` : ""}. إما أن عنوان الخادم غير صحيح، أو أن مشروع Supabase متوقف مؤقتاً (Paused)، أو هناك مشكلة في اتصال الشبكة والإنترنت.`;
    const suggestion = "تحقق من اتصال الإنترنت، وتأكد من أن مشروعك في Supabase نشط (Active) ولم يدخل في وضع السكون (Paused Project)، وتأكد من صحة الرابط في DATABASE_URL.";
    return {
      isDatabaseError: true,
      category: "NETWORK",
      code: code || "P1001",
      summary: "تعذر الوصول إلى خادم قاعدة البيانات (المضيف غير متاح أو المشروع متوقف)",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `تعذر الاتصال بخادم قاعدة البيانات [رمز: ${code || "P1001"}]: ${detail} ${suggestion}`,
      host,
    };
  }

  // 3. Connection Pool Exhaustion
  if (
    code === "P2024" ||
    code === "53300" ||
    code === "53400" ||
    lowerMsg.includes("connection pool") ||
    lowerMsg.includes("too many connections") ||
    lowerMsg.includes("pool exhausted")
  ) {
    const detail = "تجاوز عدد الاتصالات المتزامنة الحد الأقصى المسموح به في تجمع الاتصالات (Connection Pool Exhausted).";
    const suggestion = "تأكد من استخدام منفذ Supabase Pooler (6543/5432) واضبط سعة التجمع عبر DATABASE_POOL_MAX بما يناسب خادمك.";
    return {
      isDatabaseError: true,
      category: "POOL",
      code: code || "P2024",
      summary: "استنفاد تجمع اتصالات قاعدة البيانات (عدد اتصالات زائد)",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `استنفاد اتصالات قاعدة البيانات [رمز: ${code || "P2024"}]: ${detail} ${suggestion}`,
      host,
    };
  }

  // 4. Timeout
  if (
    code === "P1002" ||
    code === "P1008" ||
    code === "ETIMEDOUT" ||
    code === "57014" ||
    lowerMsg.includes("timed out") ||
    lowerMsg.includes("operation timed out")
  ) {
    const detail = `استجاب خادم قاعدة البيانات ببطء شديد وتجاوزت العملية مهلة الانتظار المحددة${host ? ` لخادم (${host})` : ""}.`;
    const suggestion = "تحقق من استقرار اتصال الإنترنت وسرعة استجابة قاعدة البيانات، أو ارفع مهلة الاتصال عبر DATABASE_CONNECTION_TIMEOUT_MS.";
    return {
      isDatabaseError: true,
      category: "TIMEOUT",
      code: code || "P1002",
      summary: "انتهت مهلة الانتظار لقاعدة البيانات (Timeout)",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `انتهت مهلة اتصال قاعدة البيانات [رمز: ${code || "P1002"}]: ${detail} ${suggestion}`,
      host,
    };
  }
  if (
    code === "P1011" ||
    lowerMsg.includes("tls") ||
    lowerMsg.includes("certificate") ||
    lowerMsg.includes("ssl") ||
    ["CERT_HAS_EXPIRED", "DEPTH_ZERO_SELF_SIGNED_CERT", "SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE"].includes(code)
  ) {
    const detail = "فشل إنشاء اتصال مشفر وآمن (TLS/SSL) مع خادم قاعدة البيانات. قد يكون السبب شهادة غير موثوقة أو عدم توافق نمط التشفير المطلوب.";
    const suggestion = "تأكد من إعدادات التشفير وتمرير sslmode=require بشكل صحيح، وتأكد من صلاحية شهادة الخادم.";
    return {
      isDatabaseError: true,
      category: "SSL",
      code: code || "P1011",
      summary: "خطأ في شهادة الأمان وتشفير الاتصال (TLS/SSL)",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `خطأ في أمان وتشفير قاعدة البيانات [رمز: ${code || "P1011"}]: ${detail} ${suggestion}`,
      host,
    };
  }


  // 6. Server Closed Connection
  if (
    code === "P1017" ||
    code === "ECONNRESET" ||
    code === "EPIPE" ||
    code === "57P01" ||
    code === "57P02" ||
    code === "57P03" ||
    lowerMsg.includes("server has closed the connection") ||
    lowerMsg.includes("socket hang up")
  ) {
    const detail = "قام خادم قاعدة البيانات بإغلاق الاتصال فجأة أثناء معالجة الطلب.";
    const suggestion = "أعد المحاولة. إذا تكررت المشكلة، راجع حالة خادم Supabase للتأكد من عدم إعادة تشغيل الخادم تلقائياً.";
    return {
      isDatabaseError: true,
      category: "CONNECTION_CLOSED",
      code: code || "P1017",
      summary: "قطع الخادم الاتصال بشكل غير متوقع",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `انقطع اتصال قاعدة البيانات [رمز: ${code || "P1017"}]: ${detail} ${suggestion}`,
      host,
    };
  }

  // 7. Database Not Found
  if (code === "P1003" || code === "3D000" || lowerMsg.includes("database does not exist")) {
    const detail = `قاعدة البيانات المطلوبة غير موجودة على الخادم${host ? ` (${host})` : ""}.`;
    const suggestion = "تحقق من اسم قاعدة البيانات المكتوب في نهاية مسار رابط DATABASE_URL (المسار الافتراضي هو /postgres).";
    return {
      isDatabaseError: true,
      category: "NOT_FOUND_DB",
      code: code || "P1003",
      summary: "قاعدة البيانات المطلوبة غير موجودة",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `خطأ في اسم قاعدة البيانات [رمز: ${code || "P1003"}]: ${detail} ${suggestion}`,
      host,
    };
  }

  // 8. Unique Constraint Violation
  if (code === "P2002" || code === "23505" || lowerMsg.includes("unique constraint")) {
    const fieldsList = fields.length > 0 ? fields.join(", ") : "أحد الحقول الفريدة";
    const detail = `يوجد سجل مسجل مسبقاً بنفس القيمة في الحقل: (${fieldsList}).`;
    const suggestion = "يرجى تغيير القيمة المدخلة لتكون فريدة وغير مكررة.";
    return {
      isDatabaseError: true,
      category: "CONSTRAINT_UNIQUE",
      code: code || "P2002",
      summary: "تعارض في البيانات: القيمة مسجلة مسبقاً ومكررة",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `تعارض بيانات في قاعدة البيانات [رمز: ${code || "P2002"}]: ${detail} ${suggestion}`,
      fields,
    };
  }

  // 9. Foreign Key Constraint Violation
  if (code === "P2003" || code === "23503" || lowerMsg.includes("foreign key")) {
    const fieldName = fields[0] || "المرتبط";
    const detail = `فشلت العملية لوجود ارتباط بسجل آخر غير متوفر أو محذوف في قاعدة البيانات (${fieldName}).`;
    const suggestion = "تأكد من وجود وحفظ السجل الرئيسي المرتبط قبل تنفيذ العملية.";
    return {
      isDatabaseError: true,
      category: "CONSTRAINT_FOREIGN_KEY",
      code: code || "P2003",
      summary: "تعارض في المفتاح الخارجي والارتباطات",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `تعارض ارتباط في قاعدة البيانات [رمز: ${code || "P2003"}]: ${detail} ${suggestion}`,
      fields,
    };
  }

  // 10. Record Not Found
  if (code === "P2025" || lowerMsg.includes("record to update not found") || lowerMsg.includes("record not found")) {
    const detail = "السجل المطلوب قراءته أو تعديله أو حذفه غير موجود حالياً في قاعدة البيانات.";
    const suggestion = "تأكد من المعرّف (ID) وتأكد من أن السجل لم يتم حذفه من قبل مستخدم آخر.";
    return {
      isDatabaseError: true,
      category: "RECORD_NOT_FOUND",
      code: code || "P2025",
      summary: "السجل المطلوب غير موجود في قاعدة البيانات",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `السجل غير موجود [رمز: ${code || "P2025"}]: ${detail} ${suggestion}`,
    };
  }

  // 11. Not Null Constraint
  if (code === "P2011" || code === "P2012" || code === "23502" || lowerMsg.includes("null constraint")) {
    const fieldName = fields[0] || "أحد الحقول الإلزامية";
    const detail = `الحقل (${fieldName}) إلزامي في قاعدة البيانات ولا يمكن تركه فارغاً.`;
    const suggestion = "تأكد من ملء كافة البيانات والحقول الإلزامية المطلوبة.";
    return {
      isDatabaseError: true,
      category: "NOT_NULL",
      code: code || "P2011",
      summary: "حقل إلزامي مفقود في قاعدة البيانات",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `حقل إلزامي فارغ [رمز: ${code || "P2011"}]: ${detail} ${suggestion}`,
      fields,
    };
  }

  // 12. Schema / Table Not Found
  if (code === "P2021" || code === "P2022" || code === "42P01" || code === "42703" || lowerMsg.includes("does not exist in the current database")) {
    const detail = "الجدول أو العمود المطلوب غير موجود في بنية قاعدة البيانات الحالية.";
    const suggestion = "قد يلزم تطبيق ترحيلات قاعدة البيانات عبر الأمر: npm run db:migrate:deploy.";
    return {
      isDatabaseError: true,
      category: "SCHEMA_ERROR",
      code: code || "P2021",
      summary: "عدم تطابق في بنية قاعدة البيانات (جدول أو عمود غير موجود)",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `خطأ في هيكل قاعدة البيانات [رمز: ${code || "P2021"}]: ${detail} ${suggestion}`,
    };
  }

  // 13. Transactions & Deadlocks
  if (code === "P2028" || code === "P2034" || code === "40P01" || code === "40001" || lowerMsg.includes("deadlock") || lowerMsg.includes("transaction")) {
    let summary = "تعارض في معاملات قاعدة البيانات (قفل مؤقت)";
    let detail = "تعارضت العملية مع معاملة أخرى تجري في نفس اللحظة أو حدث قفل مؤقت (Deadlock/Write Conflict).";
    let suggestion = "يرجى إعادة المحاولة بعد ثوانٍ قليلة.";

    if (lowerMsg.includes("unable to start a transaction in the given time")) {
      summary = "انتهت مهلة بدء المعاملة (تجمع الاتصالات ممتلئ أو بطء في الشبكة)";
      detail = "تعذر حجز اتصال لبدء المعاملة خلال المهلة المحددة بسبب انشغال تجمع الاتصالات أو بطء استجابة الخادم البعيد.";
      suggestion = "تمت زيادة مهلة الانتظار تلقائياً. تأكد من استقرار سرعة الإنترنت وأعد المحاولة.";
    } else if (lowerMsg.includes("transaction already closed") || (code === "P2028" && lowerMsg.includes("timed out"))) {
      summary = "انتهت مهلة تنفيذ المعاملة في قاعدة البيانات (Transaction Timeout)";
      detail = "استغرقت المعاملة وقتاً أطول من المهلة المسموح بها لإتمام العمليات المتتابعة وأُغلقت تلقائياً.";
      suggestion = "تمت زيادة مهلة المعاملات لتناسب سرعة الخادم عن بُعد. يرجى إعادة المحاولة.";
    } else if (lowerMsg.includes("deadlock") || code === "40P01") {
      summary = "تعارض قفل متزامن في قاعدة البيانات (Deadlock)";
      detail = "حاولت عمليتان في نفس اللحظة تعديل نفس السجلات في قاعدة البيانات مما تسبب في قفل متبادل.";
      suggestion = "يرجى إعادة المحاولة بعد ثانية واحدة.";
    }

    return {
      isDatabaseError: true,
      category: "TRANSACTION",
      code: code || "P2028",
      summary,
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `${summary} [رمز: ${code || "P2028"}]: ${detail} ${suggestion}`,
    };
  }

  // 14. Configuration Error
  if (isConfig) {
    const detail = "متغير DATABASE_URL مفقود أو غير مضبوط بشكل سليم في بيئة التشغيل.";
    const suggestion = "تحقق من وجود DATABASE_URL داخل ملف .env.local والتأكد من أنه رابط PostgreSQL صالح.";
    return {
      isDatabaseError: true,
      category: "CONFIG",
      code: code || "CONFIG_ERROR",
      summary: "إعدادات اتصال قاعدة البيانات غير مهيأة",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `خطأ في إعدادات قاعدة البيانات: ${detail} ${suggestion}`,
    };
  }

  // 15. Other / General Database Error
  if (isDatabaseError) {
    const detail = technicalMessage ? `تفاصيل الخطأ: ${technicalMessage}` : "حدث خطأ أثناء تنفيذ عملية قاعدة البيانات.";
    const suggestion = "يرجى مراجعة سجلات الخادم أو التحقق من صحة الاستعلام.";
    return {
      isDatabaseError: true,
      category: "UNKNOWN",
      code: code || "DB_ERROR",
      summary: "خطأ غير متوقع في قاعدة البيانات",
      detail,
      suggestion,
      technicalMessage,
      formattedMessage: `خطأ في قاعدة البيانات [رمز: ${code || "DB_ERROR"}]: ${detail}`,
      host,
    };
  }

  // Not a database error (e.g. application logic, validation, custom error)
  return {
    isDatabaseError: false,
    category: "UNKNOWN",
    code: code || "APP_ERROR",
    summary: "خطأ في التطبيق",
    detail: technicalMessage || "حدث خطأ أثناء معالجة الطلب.",
    suggestion: "يرجى مراجعة البيانات المدخلة والمحاولة مرة أخرى.",
    technicalMessage,
    formattedMessage: technicalMessage || "حدث خطأ أثناء معالجة الطلب.",
  };
}

/**
 * Returns a detailed, human-readable Arabic error message if the error is from the database,
 * or formats the error safely with fallback.
 * 
 * @param {unknown} error 
 * @param {string} [fallbackMessage]
 * @returns {string}
 */
export function formatDatabaseErrorMessage(error, fallbackMessage) {
  if (!error) return fallbackMessage || "تمت العملية بنجاح.";
  const diagnosis = diagnoseDatabaseError(error);
  if (diagnosis.isDatabaseError) {
    return diagnosis.formattedMessage;
  }
  return fallbackMessage || diagnosis.formattedMessage;
}
