"use client";

import { useEffect } from "react";
import { Button, Container } from "@/components/ui";
import { diagnoseDatabaseError } from "@/lib/db/database-error.mjs";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const diagnosis = diagnoseDatabaseError(error);

  useEffect(() => {
    console.error("Root application error:", {
      message: error?.message,
      digest: error?.digest,
      diagnosis,
    });
  }, [error, diagnosis]);

  const isDb = diagnosis.isDatabaseError;

  return (
    <main lang="ar" dir="rtl">
      <Container width="reading" className="grid gap-4 py-20 text-start">
        <div className="flex items-center gap-3">
          <span className="text-3xl text-rose-600 font-bold">⚠️</span>
          <div>
            <h1 className="text-2xl font-semibold">
              {isDb ? diagnosis.summary : "حدث خطأ غير متوقع"}
            </h1>
            {isDb && diagnosis.code && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-medium">
                رمز الخطأ: {diagnosis.code}
              </span>
            )}
          </div>
        </div>

        <p className="text-slate-700 leading-relaxed font-medium">
          {isDb ? diagnosis.detail : "يرجى المحاولة مرة أخرى."}
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

        <Button className="w-fit mt-2" onClick={reset}>إعادة المحاولة</Button>
      </Container>
    </main>
  );
}

