const slugPattern = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const skuPattern = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/;
const maxMoney = 9999999999.99;

const text = (value) => (typeof value === "string" ? value.trim() : "");

function money(value, required, errors, key) {
  const raw = text(value);
  if (!raw && !required) return null;
  if (!/^(?:\d{1,10})(?:\.\d{1,2})?$/.test(raw)) {
    errors[key] = "invalidMoney";
    return null;
  }
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0 || amount > maxMoney) {
    errors[key] = "invalidMoney";
    return null;
  }
  return amount.toFixed(2);
}

function optionalHttpsUrls(value) {
  const raw = text(value);
  if (!raw) return { urls: [], error: null };
  const urls = raw.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
  if (urls.length > 8) return { urls: [], error: "tooManyImages" };
  for (const value of urls) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.username || url.password || value.length > 2048) {
        return { urls: [], error: "invalidImageUrl" };
      }
    } catch {
      return { urls: [], error: "invalidImageUrl" };
    }
  }
  return { urls, error: null };
}

function uploadedImageAssets(value) {
  const raw = text(value);
  if (!raw) return { images: [], error: null };
  let entries;
  try { entries = JSON.parse(raw); } catch { return { images: [], error: "invalidImageUrl" }; }
  if (!Array.isArray(entries) || entries.length > 8) return { images: [], error: entries?.length > 8 ? "tooManyImages" : "invalidImageUrl" };
  const images = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.url !== "string" || typeof entry.publicId !== "string") {
      return { images: [], error: "invalidImageUrl" };
    }
    try {
      const url = new URL(entry.url);
      const publicId = entry.publicId.trim();
      if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || url.username || url.password || entry.url.length > 2048 || !/^farasha\/products\/[0-9a-f-]{36}$/i.test(publicId) || !url.pathname.includes(`/image/upload/`) || !url.pathname.includes(publicId)) {
        return { images: [], error: "invalidImageUrl" };
      }
      const colorName = (entry.colorName && typeof entry.colorName === "string") ? entry.colorName.trim().slice(0, 50) : undefined;
      images.push({ url: url.href, publicId, ...(colorName ? { colorName } : {}) });
    } catch {
      return { images: [], error: "invalidImageUrl" };
    }
  }
  return { images, error: null };
}

export function parseVariantData(formData, errors) {
  const hasVariants = formData.get("hasVariants") === "true" || formData.get("hasVariants") === "on";
  if (!hasVariants) {
    return { hasVariants: false, colors: [], sizes: [], variants: [] };
  }

  const colorsRaw = text(formData.get("colorsJson"));
  const sizesRaw = text(formData.get("sizesJson"));
  const variantsRaw = text(formData.get("variantsJson"));

  let colors = [];
  let sizes = [];
  let variants = [];

  try {
    if (colorsRaw) colors = JSON.parse(colorsRaw);
  } catch {
    errors.variants = "invalidVariants";
  }

  try {
    if (sizesRaw) sizes = JSON.parse(sizesRaw);
  } catch {
    errors.variants = "invalidVariants";
  }

  try {
    if (variantsRaw) variants = JSON.parse(variantsRaw);
  } catch {
    errors.variants = "invalidVariants";
  }

  if (!Array.isArray(colors)) colors = [];
  if (!Array.isArray(sizes)) sizes = [];
  if (!Array.isArray(variants)) variants = [];

  const validColors = colors
    .filter((c) => c && typeof c === "object" && typeof c.name === "string" && c.name.trim())
    .map((c) => ({
      name: c.name.trim().slice(0, 50),
      hex: typeof c.hex === "string" && /^#[0-9A-Fa-f]{6}$/.test(c.hex.trim()) ? c.hex.trim() : "#000000",
    }));

  const validSizes = sizes
    .filter((s) => typeof s === "string" && s.trim())
    .map((s) => s.trim().slice(0, 30));

  const validVariants = [];
  const seenCombinations = new Set();

  for (const v of variants) {
    if (!v || typeof v !== "object") continue;
    const colorName = typeof v.colorName === "string" ? v.colorName.trim() : "";
    const sizeLabel = typeof v.sizeLabel === "string" ? v.sizeLabel.trim() : "";
    const key = `${colorName.toLowerCase()}|||${sizeLabel.toLowerCase()}`;
    if (seenCombinations.has(key)) continue;
    seenCombinations.add(key);

    const colorObj = validColors.find((c) => c.name.toLowerCase() === colorName.toLowerCase());
    const hex = colorObj ? colorObj.hex : (typeof v.colorHex === "string" && /^#[0-9A-Fa-f]{6}$/.test(v.colorHex.trim()) ? v.colorHex.trim() : "#000000");

    let qty = 0;
    if (typeof v.stockQuantity === "number") {
      qty = Math.max(0, Math.floor(v.stockQuantity));
    } else if (typeof v.stockQuantity === "string" && /^(0|[1-9]\d{0,8})$/.test(v.stockQuantity.trim())) {
      qty = Number(v.stockQuantity.trim());
    }

    const colorImageUrl = typeof v.colorImageUrl === "string" && v.colorImageUrl.trim() ? v.colorImageUrl.trim() : "";

    validVariants.push({
      colorName: colorObj?.name ?? colorName,
      colorHex: hex,
      colorImageUrl,
      sizeLabel,
      stockQuantity: qty,
    });
  }

  if (validVariants.length === 0) {
    errors.variants = "requiredVariants";
  }

  return {
    hasVariants: true,
    colors: validColors,
    sizes: validSizes,
    variants: validVariants,
  };
}

export function parseProductInput(formData) {
  const errors = {};
  const nameAr = text(formData.get("nameAr"));
  const nameEn = text(formData.get("nameEn"));
  const slug = text(formData.get("slug")).toLowerCase();
  const skuCode = text(formData.get("skuCode"));
  const descriptionAr = text(formData.get("descriptionAr"));
  const descriptionEn = text(formData.get("descriptionEn"));
  const seoTitleAr = text(formData.get("seoTitleAr"));
  const seoDescriptionAr = text(formData.get("seoDescriptionAr"));
  const seoTitleEn = text(formData.get("seoTitleEn"));
  const seoDescriptionEn = text(formData.get("seoDescriptionEn"));
  const categoryId = text(formData.get("categoryId")) || null;
  const requestedPrimaryImagePublicId = text(formData.get("primaryImagePublicId"));
  const price = money(formData.get("price"), true, errors, "price");
  const compareAtPrice = money(formData.get("compareAtPrice"), false, errors, "compareAtPrice");
  const stockRaw = text(formData.get("stockQuantity"));
  const stockQuantity = /^(0|[1-9]\d{0,8})$/.test(stockRaw) ? Number(stockRaw) : (formData.get("hasVariants") === "true" || formData.get("hasVariants") === "on" ? 0 : null);
  const imageResult = optionalHttpsUrls(formData.get("imageUrls"));
  const imageAssetResult = uploadedImageAssets(formData.get("imageAssets"));
  const variantData = parseVariantData(formData, errors);
  const colorNamesByKey = new Map(variantData.colors.map((color) => [color.name.trim().toLowerCase(), color.name]));
  const uploadedImages = imageAssetResult.images.map((image) => {
    if (!image.colorName) return image;
    const colorName = colorNamesByKey.get(image.colorName.trim().slice(0, 50).toLowerCase());
    return colorName ? { ...image, colorName } : { ...image, colorName: undefined };
  });

  if (!nameAr) errors.nameAr = "required";
  else if (nameAr.length > 160) errors.nameAr = "tooLong";
  if (nameEn.length > 160) errors.nameEn = "tooLong";
  if (!slugPattern.test(slug) || slug.length > 180) errors.slug = "invalidSlug";
  if (skuCode && !skuPattern.test(skuCode)) errors.skuCode = "invalidSku";
  if (descriptionAr.length > 5000) errors.descriptionAr = "tooLong";
  if (descriptionEn.length > 5000) errors.descriptionEn = "tooLong";
  if (seoTitleAr.length > 180) errors.seoTitleAr = "tooLong";
  if (seoDescriptionAr.length > 500) errors.seoDescriptionAr = "tooLong";
  if (seoTitleEn.length > 180) errors.seoTitleEn = "tooLong";
  if (seoDescriptionEn.length > 500) errors.seoDescriptionEn = "tooLong";
  if (!variantData.hasVariants && stockQuantity === null) errors.stockQuantity = "invalidStock";
  if (imageResult.error) errors.imageUrls = imageResult.error;
  if (imageAssetResult.error) errors.imageUrls = imageAssetResult.error;
  if (requestedPrimaryImagePublicId && !imageAssetResult.error && !imageAssetResult.images.some(({ publicId }) => publicId === requestedPrimaryImagePublicId)) {
    errors.imageUrls = "invalidImageUrl";
  }
  if (!imageResult.error && !imageAssetResult.error && imageResult.urls.length + imageAssetResult.images.length > 8) errors.imageUrls = "tooManyImages";
  if (compareAtPrice !== null && price !== null && Number(compareAtPrice) < Number(price)) {
    errors.compareAtPrice = "comparePriceBelowPrice";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      nameAr,
      nameEn,
      slug,
      skuCode,
      descriptionAr,
      descriptionEn,
      seoTitleAr,
      seoDescriptionAr,
      seoTitleEn,
      seoDescriptionEn,
      categoryId,
      price,
      compareAtPrice,
      stockQuantity: variantData.hasVariants ? variantData.variants.reduce((sum, v) => sum + v.stockQuantity, 0) : (stockQuantity ?? 0),
      imageUrls: imageResult.urls,
      uploadedImages,
      primaryImagePublicId: requestedPrimaryImagePublicId || imageAssetResult.images[0]?.publicId || "",
      isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
      hasVariants: variantData.hasVariants,
      variantColors: variantData.colors,
      variantSizes: variantData.sizes,
      variants: variantData.variants,
    },
  };
}

export function parseCategoryInput(formData) {
  const errors = {};
  const nameAr = text(formData.get("nameAr"));
  const nameEn = text(formData.get("nameEn"));
  const slug = text(formData.get("slug")).toLowerCase();
  const descriptionAr = text(formData.get("descriptionAr"));
  const descriptionEn = text(formData.get("descriptionEn"));
  const seoTitleAr = text(formData.get("seoTitleAr"));
  const seoDescriptionAr = text(formData.get("seoDescriptionAr"));
  const seoTitleEn = text(formData.get("seoTitleEn"));
  const seoDescriptionEn = text(formData.get("seoDescriptionEn"));
  const parentId = text(formData.get("parentId")) || null;
  const productIds = [...new Set(formData.getAll("productIds").filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean))];

  if (!nameAr) errors.nameAr = "required";
  else if (nameAr.length > 120) errors.nameAr = "tooLong";
  if (nameEn.length > 120) errors.nameEn = "tooLong";
  if (!slugPattern.test(slug) || slug.length > 180) errors.slug = "invalidSlug";
  if (descriptionAr.length > 3000) errors.descriptionAr = "tooLong";
  if (descriptionEn.length > 3000) errors.descriptionEn = "tooLong";
  if (seoTitleAr.length > 180) errors.seoTitleAr = "tooLong";
  if (seoDescriptionAr.length > 500) errors.seoDescriptionAr = "tooLong";
  if (seoTitleEn.length > 180) errors.seoTitleEn = "tooLong";
  if (seoDescriptionEn.length > 500) errors.seoDescriptionEn = "tooLong";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      nameAr,
      nameEn,
      slug,
      descriptionAr,
      descriptionEn,
      seoTitleAr,
      seoDescriptionAr,
      seoTitleEn,
      seoDescriptionEn,
      parentId,
      isActive: formData.get("isActive") === "on",
      productIds,
    },
  };
}

export function parseInventoryInput(formData) {
  const rawQuantity = formData.get("quantity");
  const quantityRaw = typeof rawQuantity === "string" ? rawQuantity : "";
  if (!/^(0|[1-9]\d{0,8})$/.test(quantityRaw)) return { ok: false, error: "invalidStock" };
  return {
    ok: true,
    value: {
      skuId: text(formData.get("skuId")),
      productId: text(formData.get("productId")),
      quantity: Number(quantityRaw),
    },
  };
}
