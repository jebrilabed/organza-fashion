import { Badge, Card } from "@/components/ui";
import { checkDatabaseHealth } from "@/lib/db/prisma";
import { databasePoolConfig } from "@/lib/db/database-pool-config.mjs";

export async function DatabaseStatusCard() {
  const health = await checkDatabaseHealth();
  const rawUrl = process.env.DATABASE_URL || "";
  let host = "غير محدد";
  let port = "5432";
  let database = "postgres";
  try {
    if (rawUrl) {
      const parsed = new URL(rawUrl);
      host = parsed.hostname;
      port = parsed.port || "5432";
      database = parsed.pathname.replace(/^\//, "") || "postgres";
    }
  } catch {}

  const poolConfig = databasePoolConfig();

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">حالة الاتصال بقاعدة البيانات</h2>
          <p className="text-sm text-slate-600">فحص فوري للاتصال بقاعدة بيانات PostgreSQL ومراقبة التجمع والأداء.</p>
        </div>
        <Badge variant={health.connected ? "success" : "error"}>
          {health.connected ? "● متصل بنجاح" : "✕ تعذر الاتصال"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-xs">خادم قاعدة البيانات (Host)</span>
          <span className="font-mono font-medium text-slate-800 break-all">{host}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-xs">المنفذ وقاعدة البيانات</span>
          <span className="font-mono font-medium text-slate-800">{port} / {database}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-xs">سرعة الاستجابة (Latency)</span>
          <span className="font-mono font-medium text-slate-800">
            {health.connected ? `${health.latencyMs}ms` : "—"}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-slate-500 block text-xs">أقصى اتصالات التجمع (Pool Max)</span>
          <span className="font-mono font-medium text-slate-800">{poolConfig.max} اتصالات</span>
        </div>
      </div>

      {health.connected ? (
        <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          ✓ استجاب خادم قاعدة البيانات بنجاح لاستعلام الفحص المباشر في {health.latencyMs} مللي ثانية.
        </div>
      ) : (
        <div className="space-y-3 bg-rose-50 border border-rose-200 rounded-lg p-4 text-sm text-rose-900">
          <div className="font-bold flex items-center gap-2">
            <span>⚠️ {health.error?.summary || "فشل الاتصال بقاعدة البيانات"}</span>
            {health.error?.code && (
              <span className="text-xs px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-mono">
                {health.error.code}
              </span>
            )}
          </div>
          <p className="leading-relaxed">{health.error?.detail}</p>
          {health.error?.suggestion && (
            <div className="bg-white/80 p-3 rounded border border-rose-300 text-xs">
              <strong>💡 الحل المقترح:</strong> {health.error.suggestion}
            </div>
          )}
          {health.error?.technicalMessage && (
            <details className="text-xs font-mono text-slate-700 bg-white/60 p-2 rounded">
              <summary className="cursor-pointer font-bold">التفاصيل التقنية للخطأ</summary>
              <pre className="mt-1 whitespace-pre-wrap break-all">{health.error.technicalMessage}</pre>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}
