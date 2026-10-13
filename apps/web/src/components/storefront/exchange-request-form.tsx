"use client";

import { useActionState } from "react";
import { Button, Textarea } from "@/components/ui";
import { createExchangeRequestAction } from "@/app/[locale]/(store)/orders/actions";

export function ExchangeRequestForm({ orderItemId, maxQuantity }: { orderItemId: string; maxQuantity: number }) {
  const [state, action, pending] = useActionState(createExchangeRequestAction, {});
  return <form action={action} className="grid gap-3">
    <input name="orderItemId" type="hidden" value={orderItemId} />
    <Textarea label="سبب طلب التبديل" maxLength={1000} name="reason" required rows={2} />
    <label className="flex items-start gap-2 text-sm"><input className="mt-1" name="invoiceConfirmed" required type="checkbox" /><span>أؤكد أن الفاتورة متوفرة لدي.</span></label>
    <label className="flex items-start gap-2 text-sm"><input className="mt-1" name="deliveryFeeAccepted" required type="checkbox" /><span>أوافق على تحمل رسوم التوصيل الخاصة بالتبديل.</span></label>
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm font-medium">الكمية
        <input className="ui-input w-24" max={maxQuantity} min="1" name="quantity" required type="number" defaultValue="1" />
      </label>
      <Button disabled={pending} loading={pending} type="submit">إرسال طلب التبديل</Button>
    </div>
    {state.error && <p className="store-alert" role="alert">{state.error}</p>}
    {state.success && <p className="store-muted" role="status">{state.success}</p>}
  </form>;
}