"use client";
import { useActionState, useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import Image from "next/image";
import { ToastMessage } from "@/components/ui/toast";
import type { DeliveryZone } from "@/lib/phase7/validation.mjs";
import type { HomeEditorialCopy } from "@/lib/phase7/validation.mjs";
import { cloudinaryImageUrl } from "@/lib/seo/cloudinary-image.mjs";
import { ProductImageUploader, type UploadedProductImage } from "@/components/admin/product-image-uploader";
import { saveStoreSettings } from "./actions";
import { phase7Messages as messages } from "@/lib/phase7/messages";
type StoreEditorialImage = Pick<UploadedProductImage, "url" | "providerPublicId"> & { fileName?: string };
type SettingsValues = { storeName: string; description: string; whatsappNumber: string; instagramUrl: string; facebookUrl: string; email: string; address: string; isActive: boolean; bankName: string; bankAccountName: string; bankAccountNumber: string; bankIban: string; deliveryZones: DeliveryZone[]; homeEditorialCopy: HomeEditorialCopy; homeEditorialImages: StoreEditorialImage[] };
function settingsImageLoader({ src, width }: { src: string; width: number }) { return cloudinaryImageUrl(src, width) ?? src; }
export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, action, pending] = useActionState(saveStoreSettings, {});
  const [deliveryZones, setDeliveryZones] = useState(() => values.deliveryZones.map((zone, index) => ({ ...zone, key: String(index) })));
  const [homeEditorialImages, setHomeEditorialImages] = useState<StoreEditorialImage[]>(values.homeEditorialImages);
  const [uploadingImages, setUploadingImages] = useState(false);
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
    <section className="mt-6 space-y-4">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">محتوى القسم التحريري في الصفحة الرئيسية</h2>
        <Input label="النص التعريفي" name="homeEditorialEyebrow" maxLength={160} defaultValue={values.homeEditorialCopy.eyebrow} />
        <Input label="عنوان القسم" name="homeEditorialTitle" maxLength={160} defaultValue={values.homeEditorialCopy.title} />
        <Textarea label="وصف القسم" name="homeEditorialDescription" rows={3} maxLength={1000} defaultValue={values.homeEditorialCopy.description} />
        <Input label="نص الزر" name="homeEditorialCtaLabel" maxLength={160} defaultValue={values.homeEditorialCopy.ctaLabel} />
      </div>
      <h2 className="text-lg font-semibold">صور القسم التحريري في الصفحة الرئيسية</h2>
      <input name="homeEditorialImages" type="hidden" value={JSON.stringify(homeEditorialImages.map(({ url, providerPublicId }) => ({ url, providerPublicId })))} />
      <ProductImageUploader maxFiles={Math.max(0, 8 - homeEditorialImages.length)} onUploaded={(image) => setHomeEditorialImages((current) => [...current, image])} onUploadingChange={setUploadingImages} />
      {homeEditorialImages.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {homeEditorialImages.map((image, index) => <div className="grid gap-2" key={image.providerPublicId}>
          <Image alt={image.fileName || `صورة القسم ${index + 1}`} className="aspect-[4/3] w-full rounded object-cover" height={180} loader={settingsImageLoader} src={image.url} width={240} />
          <button aria-label={`حذف الصورة ${index + 1}`} className="ui-button ui-button--outline" onClick={() => setHomeEditorialImages((current) => current.filter((item) => item.providerPublicId !== image.providerPublicId))} type="button">حذف الصورة</button>
        </div>)}
      </div>}
    </section>
    <Select label={messages.ar.defaultLocale} name="defaultLocale" defaultValue="ar"><option value="ar">{messages.ar.Arabic}</option></Select>
    <label className="admin-checkbox"><input type="checkbox" name="isActive" defaultChecked={values.isActive} /><span>{messages.ar.storeActive}</span></label>
    <ToastMessage eventKey={state} message={state.error} tone="error" /><ToastMessage eventKey={state} message={state.success} tone="success" />
    <div className="admin-page__actions"><Button type="submit" disabled={uploadingImages} loading={pending}>{messages.ar.saveSettings}</Button></div>
  </form>;
}
