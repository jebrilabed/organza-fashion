"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { adminMessages as messages } from "@/lib/admin/messages";
import { diagnoseDatabaseError } from "@/lib/db/database-error.mjs";

export default function AdminRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const diagnosis = diagnoseDatabaseError(error);

  useEffect(() => {
    console.error("Admin route render error:", {
      message: error?.message,
      digest: error?.digest,
      diagnosis,
    });
  }, [error, diagnosis]);

  const isDb = diagnosis.isDatabaseError;

  return (
    <div className="admin-page">
      <Card className="admin-error-state p-6 max-w-2xl mx-auto my-10 space-y-4 text-start">
        <div className="flex items-center gap-3">
          <span className="text-3xl text-rose-600 font-bold">⚠️</span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isDb ? diagnosis.summary : messages.ar.errorTitle}
            </h1>
            {isDb && diagnosis.code && (
              <Badge variant="warning" className="mt-1">
                رمز الخطأ: {diagnosis.code}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-slate-700 leading-relaxed font-medium">
          {isDb ? diagnosis.detail : messages.ar.errorDescription}
        </p>

        {isDb && diagnosis.suggestion && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-900">
            <strong>💡 الحل المقترح:</strong> {diagnosis.suggestion}
          </div>
        )}

        {(diagnosis.technicalMessage || error?.digest) && (
          <details className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
            <summary className="cursor-pointer font-medium text-slate-700 select-none">
              التفاصيل التقنية
            </summary>
            <div className="mt-2 space-y-1 font-mono text-[11px] break-all">
              {error?.digest && <p>معرف الخطأ (Digest): {error.digest}</p>}
              {diagnosis.technicalMessage && <p>{diagnosis.technicalMessage}</p>}
            </div>
          </details>
        )}

        <div className="admin-page__actions flex gap-3 pt-2">
          <Button onClick={reset} variant="primary">
            {messages.ar.retry}
          </Button>
          <Link className="ui-button ui-button--outline" href="/admin">
            {messages.ar.returnDashboard}
          </Link>
        </div>
      </Card>
    </div>
  );
}

