"use client";
import { useActionState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { ToastMessage } from "@/components/ui/toast";
import { saveStoreSettings } from "./actions";
import { phase7Messages as messages } from "@/lib/phase7/messages";
type SettingsValues = { storeName: string; description: string; whatsappNumber: string; email: string; address: string; isActive: boolean; bankName: string; bankAccountName: string; bankAccountNumber: string; bankIban: string };
export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, action, pending] = useActionState(saveStoreSettings, {});
  return <form action={action} className="admin-form max-w-3xl">
    <Input label={messages.ar.storeName} name="storeName" required maxLength={120} defaultValue={values.storeName} />
    <Textarea label={messages.ar.storeDescription} name="description" rows={4} maxLength={2000} defaultValue={values.description} />
    <input type="hidden" name="currency" value="ILS" />
    <p>{messages.ar.currency}: ILS — {messages.ar.currencyILS}</p>
    <Input label="رقم الواتساب" name="whatsappNumber" maxLength={40} dir="ltr" placeholder="+970599123456" defaultValue={values.whatsappNumber} />
    <Input label={messages.ar.storeEmail} name="email" type="email" maxLength={254} dir="ltr" defaultValue={values.email} />
    <Textarea label={messages.ar.storeAddress} name="address" rows={3} maxLength={500} defaultValue={values.address} />
    <h2 className="mt-4 text-lg font-semibold">بيانات التحويل البنكي</h2>
    <p className="text-sm text-slate-600">تظهر هذه البيانات للعملاء عند اختيار التحويل البنكي. أدخل رقم الحساب أو الآيبان على الأقل.</p>
    <Input label="اسم البنك" name="bankName" maxLength={120} defaultValue={values.bankName} />
    <Input label="اسم صاحب الحساب" name="bankAccountName" maxLength={120} defaultValue={values.bankAccountName} />
    <Input label="رقم الحساب" name="bankAccountNumber" maxLength={64} dir="ltr" defaultValue={values.bankAccountNumber} />
    <Input label="رقم الآيبان" name="bankIban" maxLength={64} dir="ltr" defaultValue={values.bankIban} />
    <Select label={messages.ar.defaultLocale} name="defaultLocale" defaultValue="ar"><option value="ar">{messages.ar.Arabic}</option></Select>
    <label className="admin-checkbox"><input type="checkbox" name="isActive" defaultChecked={values.isActive} /><span>{messages.ar.storeActive}</span></label>
    <ToastMessage eventKey={state} message={state.error} tone="error" /><ToastMessage eventKey={state} message={state.success} tone="success" />
    <div className="admin-page__actions"><Button type="submit" loading={pending}>{messages.ar.saveSettings}</Button></div>
  </form>;
}
