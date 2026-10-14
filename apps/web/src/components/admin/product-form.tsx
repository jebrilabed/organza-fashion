"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Input, Select, Textarea } from "@/components/ui";
import { ToastMessage } from "@/components/ui/toast";
import { adminMessages as messages } from "@/lib/admin/messages";
import { phase7Messages } from "@/lib/phase7/messages";
import type { AdminActionState } from "@/lib/admin/config";
import { saveProduct } from "@/app/(admin)/admin/actions";
import { SubmitButton } from "./submit-button";
import { ProductImageUploader, type UploadedProductImage } from "./product-image-uploader";
import { cloudinaryImageUrl } from "@/lib/seo/cloudinary-image.mjs";

import { ProductVariantSection, type ColorOption, type VariantQuantityMap } from "./product-variant-section";

function productImageLoader({ src, width }: { src: string; width: number }) {
  return cloudinaryImageUrl(src, width) ?? src;
}

export type ProductFormValues = {
  id?: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr: string;
  descriptionEn: string;
  seoTitleAr: string;
  seoDescriptionAr: string;
  seoTitleEn: string;
  seoDescriptionEn: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: number;
  availability: "AVAILABLE" | "IN_TRANSIT";
  shippingDurationDays: number | null;
  categoryId: string;
  imageUrls: string[];
  isActive: boolean;
  hasVariants?: boolean;
  initialColors?: ColorOption[];
  initialSizes?: string[];
  initialQuantities?: VariantQuantityMap;
};

type UploadedImageWithColor = UploadedProductImage & { colorName?: string };

function ImageColorPicker({
  image,
  colors,
  onColorChange,
}: {
  image: UploadedImageWithColor;
  colors: ColorOption[];
  onColorChange: (colorName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedColor = colors.find((c) => c.name === image.colorName);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!colors.length) {
    return (
      <div
        className="flex items-center gap-2 mt-2 p-2 text-xs text-[var(--color-muted)] border border-dashed border-[var(--color-border)] rounded-[var(--radius-card)]"
        style={{ direction: "rtl" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
        <span>أضف ألواناً في قسم المتغيرات لربطها بهذه الصورة</span>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative", direction: "rtl" }}>
      {/* Trigger button */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 10px",
          background: "var(--brand-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Color dot or placeholder */}
        {selectedColor ? (
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: selectedColor.hex,
              border: "1px solid rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
          />
        ) : (
          <span style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}>🎨</span>
        )}
        <span style={{ fontSize: "12px", color: selectedColor ? "var(--text-primary)" : "var(--text-muted)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedColor ? (selectedColor.name.startsWith("#") ? selectedColor.hex : selectedColor.name) : "اختر لون الصورة"}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            left: 0,
            zIndex: 100,
            background: "white",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: "4px",
            maxHeight: "180px",
            overflowY: "auto",
          }}
        >
          <div
            onClick={() => { onColorChange(""); setOpen(false); }}
            style={{ padding: "7px 10px", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer", borderRadius: "6px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            بدون لون
          </div>
          {colors.map((c) => (
            <div
              key={c.name}
              onClick={() => { onColorChange(c.name); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", cursor: "pointer", borderRadius: "6px" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-secondary)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: c.hex, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                {c.name.startsWith("#") ? c.hex : c.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export function ProductForm({
  values,
  categories,
}: {
  values: ProductFormValues;
  categories: { id: string; name: string }[];
}) {
  const [state, action] = useActionState<AdminActionState, FormData>(saveProduct, {});
  const router = useRouter();
  const [formValues, setFormValues] = useState(() => ({
    nameAr: values.nameAr,
    descriptionAr: values.descriptionAr,
    price: values.price,
    compareAtPrice: values.compareAtPrice,
    stockQuantity: String(values.stockQuantity),
    categoryId: values.categoryId,
    isActive: values.isActive,
  }));
  const [hasVariants, setHasVariants] = useState(values.hasVariants ?? false);
  const [availability, setAvailability] = useState(values.availability);
  const [shippingDurationDays, setShippingDurationDays] = useState(values.shippingDurationDays ? String(values.shippingDurationDays) : "");
  const [uploadedImages, setUploadedImages] = useState<UploadedImageWithColor[]>([]);
  const [primaryImagePublicId, setPrimaryImagePublicId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [variantColors, setVariantColors] = useState<ColorOption[]>(values.initialColors ?? []);
  const fieldError = (key: string) => state.fieldErrors?.[key];

  useEffect(() => {
    if (state.redirectTo) router.replace(state.redirectTo);
  }, [router, state.redirectTo]);

  // Listen for color changes emitted by ProductVariantSection
  useEffect(() => {
    const handler = (e: CustomEvent) => setVariantColors(e.detail as ColorOption[]);
    window.addEventListener("colorsChanged", handler as EventListener);
    return () => window.removeEventListener("colorsChanged", handler as EventListener);
  }, []);

  const updateImageColor = (index: number, colorName: string) => {
    setUploadedImages((current) =>
      current.map((img, i) =>
        i === index ? { ...img, colorName: colorName || undefined } : img
      )
    );
  };

  const handleImageUploaded = (image: UploadedProductImage) => {
    setUploadedImages((current) => [...current, image]);
    setPrimaryImagePublicId((current) => current || image.providerPublicId);
  };

  const removeUploadedImage = (image: UploadedImageWithColor) => {
    const remainingImages = uploadedImages.filter((item) => item.providerPublicId !== image.providerPublicId);
    setUploadedImages(remainingImages);
    setPrimaryImagePublicId((current) => current === image.providerPublicId
      ? remainingImages[0]?.providerPublicId ?? ""
      : current);
  };

  return (
    <Card>
      <form action={action} className="admin-form">
        {values.id && <input type="hidden" name="productId" value={values.id} />}
        {values.id && <>
          <input type="hidden" name="nameEn" value={values.nameEn} />
          <input type="hidden" name="slug" value={values.slug} />
          <input type="hidden" name="descriptionEn" value={values.descriptionEn} />
          <input type="hidden" name="seoTitleAr" value={values.seoTitleAr} />
          <input type="hidden" name="seoDescriptionAr" value={values.seoDescriptionAr} />
          <input type="hidden" name="seoTitleEn" value={values.seoTitleEn} />
          <input type="hidden" name="seoDescriptionEn" value={values.seoDescriptionEn} />
        </>}
        {!values.id && (
          <>
            <input
              type="hidden"
              name="imageAssets"
              value={JSON.stringify(
                uploadedImages.map(({ url, providerPublicId, colorName }) => ({
                  url,
                  publicId: providerPublicId,
                  ...(colorName ? { colorName } : {}),
                }))
              )}
            />
            <input type="hidden" name="primaryImagePublicId" value={primaryImagePublicId} />
          </>
        )}
        <div className="admin-form__grid">
          <Input name="nameAr" label={messages.ar.productName} required maxLength={160} value={formValues.nameAr} onChange={(event) => setFormValues((current) => ({ ...current, nameAr: event.target.value }))} error={fieldError("nameAr")} />
          <Input name="price" label={messages.ar.price} required type="text" inputMode="decimal" dir="ltr" value={formValues.price} onChange={(event) => setFormValues((current) => ({ ...current, price: event.target.value }))} error={fieldError("price")} />
          <Input name="compareAtPrice" label={messages.ar.compareAtPrice} type="text" inputMode="decimal" dir="ltr" value={formValues.compareAtPrice} onChange={(event) => setFormValues((current) => ({ ...current, compareAtPrice: event.target.value }))} error={fieldError("compareAtPrice")} />
          <Select name="availability" label="حالة التوفر" value={availability} onChange={(event) => setAvailability(event.target.value as ProductFormValues["availability"])} error={fieldError("availability")}>
            <option value="AVAILABLE">متوفر</option>
            <option value="IN_TRANSIT">قيد الشحن</option>
          </Select>
          {availability === "IN_TRANSIT" && <Input name="shippingDurationDays" label="مدة الشحن المتوقعة (بالأيام)" required type="number" min="1" max="365" step="1" inputMode="numeric" value={shippingDurationDays} onChange={(event) => setShippingDurationDays(event.target.value)} error={fieldError("shippingDurationDays")} />}
          <Input name="stockQuantity" label={messages.ar.stock} required type="number" min="0" max="999999999" step="1" inputMode="numeric" value={formValues.stockQuantity} onChange={(event) => {
            const val = event.target.value;
            setFormValues((current) => ({ ...current, stockQuantity: val }));
            if (hasVariants) {
              window.dispatchEvent(new CustomEvent("productStockQuantityCommitted", { detail: val }));
            }
          }} onBlur={(event) => {
            if (hasVariants) {
              window.dispatchEvent(new CustomEvent("productStockQuantityCommitted", { detail: event.currentTarget.value }));
            }
          }} error={fieldError("stockQuantity")} />
          <Select name="categoryId" label={messages.ar.category} value={formValues.categoryId} onChange={(event) => setFormValues((current) => ({ ...current, categoryId: event.target.value }))} error={fieldError("categoryId")}>
            <option value="">{messages.ar.noCategory}</option>
            {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </Select>
          <Textarea className="admin-form__wide" name="descriptionAr" label={messages.ar.description} rows={4} maxLength={5000} value={formValues.descriptionAr} onChange={(event) => setFormValues((current) => ({ ...current, descriptionAr: event.target.value }))} error={fieldError("descriptionAr")} />
          {!values.id && <div className="admin-form__wide admin-product-image-field">
            <ProductImageUploader
              maxFiles={8 - uploadedImages.length}
              onUploaded={handleImageUploaded}
              onUploadingChange={setUploading}
            />
            {uploadedImages.length > 0 && (
              <div className="admin-product-image-previews">
                {uploadedImages.map((image, index) => (
                  <div
                    className={`admin-product-image-preview${primaryImagePublicId === image.providerPublicId ? " is-primary" : ""}`}
                    key={image.providerPublicId}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Image
                        alt={image.fileName}
                        height={80}
                        loader={productImageLoader}
                        src={image.url}
                        width={80}
                        style={{ borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <label className="admin-product-image-primary">
                          <input
                            checked={primaryImagePublicId === image.providerPublicId}
                            name="primaryImageChoice"
                            onChange={() => setPrimaryImagePublicId(image.providerPublicId)}
                            type="radio"
                          />
                          <span>{primaryImagePublicId === image.providerPublicId ? phase7Messages.ar.primaryImage : phase7Messages.ar.setPrimary}</span>
                        </label>
                        <span
                          title={image.fileName}
                        >
                          {image.fileName}
                        </span>
                        <button
                          aria-label={`ازالة ${image.fileName}`}
                          onClick={() => removeUploadedImage(image)}
                          type="button"
                        >
                          ازالة
                        </button>
                      </div>
                    </div>
                    <ImageColorPicker
                      image={image}
                      colors={variantColors}
                      onColorChange={(colorName) => updateImageColor(index, colorName)}
                    />
                  </div>
                ))}
              </div>
            )}
            {fieldError("imageUrls") && <p className="admin-feedback admin-feedback--error" role="alert">{fieldError("imageUrls")}</p>}
          </div>}
          {values.id && <p className="admin-form__wide">{messages.ar.imageManagerHint}</p>}
        </div>

        <ProductVariantSection
          hasVariants={values.hasVariants ?? false}
          initialColors={values.initialColors ?? []}
          initialSizes={values.initialSizes ?? []}
          initialQuantities={values.initialQuantities ?? {}}
          totalStock={Number.parseInt(formValues.stockQuantity, 10) || 0}
          onChange={(vData) => {
            setHasVariants(vData.hasVariants);
            setVariantColors(vData.colors);
            if (vData.hasVariants && (vData.colors.length > 0 || vData.sizes.length > 0)) {
              const total = Object.values(vData.quantities).reduce((a, b) => a + b, 0);
              if (total > 0) {
                setFormValues((curr) => ({ ...curr, stockQuantity: String(total) }));
              }
            }
          }}
        />

        <label className="admin-checkbox">
          <input type="checkbox" name="isActive" checked={formValues.isActive} onChange={(event) => setFormValues((current) => ({ ...current, isActive: event.target.checked }))} />
          <span>{messages.ar.activeStatus}</span>
        </label>
        <ToastMessage eventKey={state} message={state.error} tone="error" />
        <ToastMessage eventKey={state} message={state.success} tone="success" />
        <ToastMessage eventKey={state} message={state.fieldErrors ? messages.ar.genericError : undefined} tone="warning" />
        <div className="admin-page__actions">
          <SubmitButton disabled={uploading}>{messages.ar.save}</SubmitButton>
          <Link className="ui-button ui-button--ghost" href="/admin/products">{messages.ar.cancel}</Link>
        </div>
      </form>
    </Card>
  );
}
