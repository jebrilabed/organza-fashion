"use client";
import { useActionState, useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { ToastMessage } from "@/components/ui/toast";
import type { DeliveryZone } from "@/lib/phase7/validation.mjs";
import { saveStoreSettings } from "./actions";
import { phase7Messages as messages } from "@/lib/phase7/messages";
type SettingsValues = { storeName: string; description: string; whatsappNumber: string; instagramUrl: string; facebookUrl: string; email: string; address: string; isActive: boolean; bankName: string; bankAccountName: string; bankAccountNumber: string; bankIban: string; deliveryZones: DeliveryZone[] };
export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, action, pending] = useActionState(saveStoreSettings, {});
  const [deliveryZones, setDeliveryZones] = useState(() => values.deliveryZones.map((zone, index) => ({ ...zone, key: String(index) })));
  const updateDeliveryZone = (key: string, field: "name" | "price", value: string) => {
    setDeliveryZones((current) => current.map((zone) => zone.key === key ? { ...zone, [field]: value } : zone));
  };
  return <form action={action} className="admin-form max-w-3xl">
    <Input label={messages.ar.storeName} name="storeName" required maxLength={120} defaultValue={values.storeName} />
    <Textarea label={messages.ar.storeDescription} name="description" rows={4} maxLength={2000} defaultValue={values.description} />
    <input type="hidden" name="currency" value="ILS" />
    <p>{messages.ar.currency}: ILS — {messages.ar.currencyILS}</p>
    <Input label="رقم الواتساب" name="whatsappNumber" maxLength={40} dir="ltr" placeholder="+970599123456" defaultValue={values.whatsappNumber} />
    <Input label="رابط حساب إنستغرام" name="instagramUrl" type="url" maxLength={500} dir="ltr" placeholder="https://www.instagram.com/username" defaultValue={values.instagramUrl} />
    <Input label="رابط صفحة فيسبوك" name="facebookUrl" type="url" maxLength={500} dir="ltr" placeholder="https://www.facebook.com/page" defaultValue={values.facebookUrl} />
    <Input label={messages.ar.storeEmail} name="email" type="email" maxLength={254} dir="ltr" defaultValue={values.email} />
    <Textarea label={messages.ar.storeAddress} name="address" rows={3} maxLength={500} defaultValue={values.address} />
    <h2 className="mt-4 text-lg font-semibold">بيانات التحويل البنكي</h2>
    <p className="text-sm text-slate-600">تظهر هذه البيانات للعملاء عند اختيار التحويل البنكي. أدخل رقم الحساب أو الآيبان على الأقل.</p>
    <Input label="اسم البنك" name="bankName" maxLength={120} defaultValue={values.bankName} />
    <Input label="اسم صاحب الحساب" name="bankAccountName" maxLength={120} defaultValue={values.bankAccountName} />
    <Input label="رقم الحساب" name="bankAccountNumber" maxLength={64} dir="ltr" defaultValue={values.bankAccountNumber} />
    <Input label="رقم الآيبان" name="bankIban" maxLength={64} dir="ltr" defaultValue={values.bankIban} />
    <section className="mt-6 space-y-4">
      <div><h2 className="text-lg font-semibold">مناطق التوصيل</h2><p className="text-sm text-slate-600">أضف المناطق المتاحة وسعر توصيل الطلب إليها. لن يقبل المتجر الطلبات قبل إضافة منطقة واحدة على الأقل.</p></div>
      {deliveryZones.map((zone) => <div key={zone.key} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Input label="اسم المنطقة" name="deliveryZoneName" maxLength={120} value={zone.name} onChange={(event) => updateDeliveryZone(zone.key, "name", event.target.value)} />
        <Input label="سعر التوصيل (ILS)" name="deliveryZonePrice" type="text" inputMode="decimal" dir="ltr" value={zone.price} onChange={(event) => updateDeliveryZone(zone.key, "price", event.target.value)} />
        <button type="button" className="ui-button ui-button--outline" onClick={() => setDeliveryZones((current) => current.filter((item) => item.key !== zone.key))}>حذف المنطقة</button>
      </div>)}
      <button type="button" className="ui-button ui-button--outline" onClick={() => setDeliveryZones((current) => [...current, { key: crypto.randomUUID(), name: "", price: "" }])}>إضافة منطقة</button>
    </section>
    <Select label={messages.ar.defaultLocale} name="defaultLocale" defaultValue="ar"><option value="ar">{messages.ar.Arabic}</option></Select>
    <label className="admin-checkbox"><input type="checkbox" name="isActive" defaultChecked={values.isActive} /><span>{messages.ar.storeActive}</span></label>
    <ToastMessage eventKey={state} message={state.error} tone="error" /><ToastMessage eventKey={state} message={state.success} tone="success" />
    <div className="admin-page__actions"><Button type="submit" loading={pending}>{messages.ar.saveSettings}</Button></div>
  </form>;
}
