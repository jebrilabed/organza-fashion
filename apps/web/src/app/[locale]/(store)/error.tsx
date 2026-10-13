"use client";

import { useEffect } from "react";
import { Button, Container } from "@/components/ui";
import { storefrontMessages as messages } from "@/lib/storefront/messages";
import { diagnoseDatabaseError } from "@/lib/db/database-error.mjs";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const diagnosis = diagnoseDatabaseError(error);

  useEffect(() => {
    console.error("Storefront render error:", {
      message: error?.message,
      digest: error?.digest,
      diagnosis,
    });
  }, [error, diagnosis]);

  const isDb = diagnosis.isDatabaseError;

  return (
    <main className="store-main">
      <Container width="reading">
        <div className="ui-state ui-state--error py-10 space-y-4 text-start">
          <span className="ui-state__symbol text-3xl" aria-hidden="true">⚠️</span>
          <h1 className="text-xl font-bold">
            {isDb ? diagnosis.summary : messages.ar.genericError}
          </h1>
          {isDb && diagnosis.code && (
            <span className="inline-block text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-medium">
              رمز الخطأ: {diagnosis.code}
            </span>
          )}
          <p className="text-slate-700 leading-relaxed font-medium">
            {isDb ? diagnosis.detail : "تعذر إتمام العملية. حاول مرة أخرى."}
          </p>
          {isDb && diagnosis.suggestion && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-900">
              <strong>💡 تفاصيل المشكلة:</strong> {diagnosis.suggestion}
            </div>
          )}
          <Button onClick={reset}>{messages.ar.retry}</Button>
        </div>
      </Container>
    </main>
  );
}

