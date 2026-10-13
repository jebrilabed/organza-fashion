import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { adminMessages as messages } from "@/lib/admin/messages";
import { requireAdminPage } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { ProductManagement } from "@/components/admin/product-management";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        skus: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
        images: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { translations: { where: { locale: "AR" }, take: 1 } } }),
  ]);
  if (!product) notFound();
  const ar = product.translations.find((translation) => translation.locale === "AR");
  const en = product.translations.find((translation) => translation.locale === "EN");
  const sku = product.skus.find((item) => item.isDefault) ?? product.skus[0];

  const hasVariants = product.kind === "VARIANT" || product.skus.some((s) => s.variantOptions && typeof s.variantOptions === "object" && Object.keys(s.variantOptions).length > 0);
  const colorsMap = new Map<string, { hex: string; imageUrl?: string }>();
  const sizesSet = new Set<string>();
  const initialQuantities: Record<string, number> = {};

  if (hasVariants) {
    for (const s of product.skus) {
      if (!s.variantOptions || typeof s.variantOptions !== "object") continue;
      const opts = s.variantOptions as Record<string, string>;
      const colorName = opts["Color"] ?? "";
      const colorHex = opts["ColorHex"] ?? "#000000";
      const sizeLabel = opts["Size"] ?? "";

      if (colorName) {
        const currentColor = colorsMap.get(colorName);
        const imageUrl = opts["ColorImageUrl"] ?? currentColor?.imageUrl;
        colorsMap.set(colorName, { hex: colorHex, ...(imageUrl ? { imageUrl } : {}) });
      }
      if (sizeLabel) sizesSet.add(sizeLabel);

      const key = `${colorName}|||${sizeLabel}`;
      initialQuantities[key] = s.stockQuantity;
    }
  }

  const initialColors = Array.from(colorsMap.entries()).map(([name, color]) => ({ name, ...color }));
  const initialSizes = Array.from(sizesSet);

  const imageColors: Record<string, string> = {};
  if (hasVariants) {
    for (const s of product.skus) {
      if (!s.variantOptions || typeof s.variantOptions !== "object") continue;
      const opts = s.variantOptions as Record<string, string>;
      if (opts["Color"] && opts["ColorImageUrl"]) {
        imageColors[opts["ColorImageUrl"]] = opts["Color"];
      }
    }
  }

  const values: ProductFormValues = {
    id: product.id,
    nameAr: ar?.name ?? "",
    nameEn: en?.name ?? "",
    slug: product.slug,
    descriptionAr: ar?.description ?? "",
    descriptionEn: en?.description ?? "",
    seoTitleAr: ar?.seoTitle ?? "",
    seoDescriptionAr: ar?.seoDescription ?? "",
    seoTitleEn: en?.seoTitle ?? "",
    seoDescriptionEn: en?.seoDescription ?? "",
    price: sku?.price.toString() ?? "0",
    compareAtPrice: sku?.compareAtPrice?.toString() ?? "",
    stockQuantity: product.skus.reduce((sum, s) => sum + s.stockQuantity, 0),
    availability: product.availability,
    shippingDurationDays: product.shippingDurationDays,
    categoryId: product.categoryId ?? "",
    imageUrls: product.images.map((image) => image.url),
    isActive: product.status === "ACTIVE",
    hasVariants,
    initialColors,
    initialSizes,
    initialQuantities,
  };
  return <div className="admin-page"><header className="admin-page__header"><div><h1>{messages.ar.editProduct}</h1><p>{ar?.name ?? product.slug}</p></div><Link className="ui-button ui-button--ghost" href="/admin/products">{messages.ar.backToProducts}</Link></header><ProductForm values={{ ...values, imageUrls: [] }} categories={categories.map((category) => ({ id: category.id, name: category.translations[0]?.name ?? category.slug }))} /><ProductManagement
    productId={product.id}
    colors={initialColors}
    imageColors={imageColors}
    images={(product.images ?? []).map(({ id: imageId, url, providerPublicId, altText, sortOrder }) => ({
      id: imageId,
      url,
      providerPublicId,
      altText,
      sortOrder,
    }))}
  /></div>;
}
