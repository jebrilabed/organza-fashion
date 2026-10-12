const text = (value) => typeof value === "string" ? value.trim() : "";
export const supportedCurrencies = ["SAR", "USD", "EUR", "ILS", "JOD"];
export const storeCurrency = "ILS";

const deliveryMoneyPattern = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

function canonicalDeliveryPrice(value) {
  if (typeof value !== "string") return null;
  const price = value.trim();
  if (!deliveryMoneyPattern.test(price)) return null;
  const [whole, fraction = ""] = price.split(".");
  return `${whole}.${fraction.padEnd(2, "0")}`;
}

function uniqueDeliveryZones(zones) {
  const names = new Set();
  const normalized = [];
  for (const zone of zones) {
    const name = typeof zone?.name === "string" ? zone.name.trim() : "";
    const price = canonicalDeliveryPrice(typeof zone?.price === "string" ? zone.price : "");
    const key = name.toLocaleLowerCase();
    if (!name || name.length > 120 || !price || names.has(key)) return null;
    names.add(key);
    normalized.push({ name, price });
  }
  return normalized;
}

export function parseDeliveryZones(data) {
  const names = data.getAll("deliveryZoneName");
  const prices = data.getAll("deliveryZonePrice");
  if (names.length !== prices.length || names.length > 50) return { ok: false };
  const zones = [];
  for (let index = 0; index < names.length; index += 1) {
    const name = text(names[index]);
    const price = text(prices[index]);
    if (!name && !price) continue;
    zones.push({ name, price });
  }
  const normalized = uniqueDeliveryZones(zones);
  return normalized ? { ok: true, value: normalized } : { ok: false };
}

export function readDeliveryZones(value) {
  if (!Array.isArray(value) || value.length > 50) return [];
  return uniqueDeliveryZones(value) ?? [];
}

export function parseRegistration(data) {
  const name = text(data.get("name"));
  const email = text(data.get("email")).toLowerCase();
  const phone = text(data.get("phone")).replace(/[\s().-]/g, "");
  const phoneDigits = phone.replace(/\D/g, "").length;
  const addressLine = text(data.get("addressLine"));
  const city = text(data.get("city"));
  const password = typeof data.get("password") === "string" ? data.get("password") : "";
  const confirmation = typeof data.get("confirmation") === "string" ? data.get("confirmation") : "";
  const errors = {};
  if (!name || name.length > 120) errors.name = "invalidName";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = "invalidEmail";
  if (!/^\d+$/.test(phone) || phoneDigits < 8 || phoneDigits > 15) errors.phone = "invalidPhone";
  if (!addressLine || addressLine.length > 500) errors.addressLine = "invalidAddress";
  if (!city || city.length > 120) errors.city = "invalidCity";
  if (password.length < 8 || password.length > 128) errors.password = "invalidPassword";
  if (password !== confirmation) errors.confirmation = "passwordMismatch";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { name, email, phone, addressLine, city, password } };
}

export function parseProfile(data) {
  const name = text(data.get("name"));
  if (!name || name.length > 120) return { ok: false };
  return { ok: true, value: name };
}

export function parseAddress(data) {
  const value = {
    fullName: text(data.get("fullName")), phone: text(data.get("phone")),
    addressLine: text(data.get("addressLine")), city: text(data.get("city")),
    postalCode: text(data.get("postalCode")) || null, notes: text(data.get("notes")) || null,
    isDefault: data.get("isDefault") === "on",
  };
  const errors = {};
  if (!value.fullName || value.fullName.length > 120) errors.fullName = "invalidName";
  const digits = value.phone.replace(/\D/g, "").length;
  if (digits < 6 || value.phone.length > 40 || !/^\+?[()\d\s.-]+$/.test(value.phone)) errors.phone = "invalidPhone";
  if (!value.addressLine || value.addressLine.length > 500) errors.addressLine = "invalidAddress";
  if (!value.city || value.city.length > 120) errors.city = "invalidCity";
  if (value.postalCode && value.postalCode.length > 24) errors.postalCode = "tooLong";
  if (value.notes && value.notes.length > 1000) errors.notes = "tooLong";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function parseStoreSettings(data) {
  const parsedDeliveryZones = parseDeliveryZones(data);
  const value = {
    storeName: text(data.get("storeName")), description: text(data.get("description")) || null,
    currency: storeCurrency, contactPhone: text(data.get("contactPhone")) || null,
    whatsappNumber: text(data.get("whatsappNumber")) || null,
    bankName: text(data.get("bankName")), bankAccountName: text(data.get("bankAccountName")),
    bankAccountNumber: text(data.get("bankAccountNumber")), bankIban: text(data.get("bankIban")),
    email: text(data.get("email")).toLowerCase() || null, address: text(data.get("address")) || null,
    defaultLocale: text(data.get("defaultLocale")), isActive: data.get("isActive") === "on",
    deliveryZones: parsedDeliveryZones.ok ? parsedDeliveryZones.value : [],
  };
  const errors = {};
  if (!value.storeName || value.storeName.length > 120) errors.storeName = "invalidName";
  if (value.description && value.description.length > 2000) errors.description = "tooLong";
  if (value.contactPhone && (value.contactPhone.length > 40 || !/^\+?[()\d\s.-]+$/.test(value.contactPhone))) errors.contactPhone = "invalidPhone";
  if (value.whatsappNumber && (value.whatsappNumber.length > 40 || !/^\+?[()\d\s.-]+$/.test(value.whatsappNumber))) errors.whatsappNumber = "invalidPhone";
  if (value.bankName.length > 120 || value.bankAccountName.length > 120 || value.bankAccountNumber.length > 64 || value.bankIban.length > 64) errors.bankDetails = "tooLong";
  if (value.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || value.email.length > 254)) errors.email = "invalidEmail";
  if (value.address && value.address.length > 500) errors.address = "tooLong";
  if (value.defaultLocale !== "ar") errors.defaultLocale = "invalidLocale";
  if (!parsedDeliveryZones.ok) errors.deliveryZones = "invalidDeliveryZones";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function parseSku(data) {
  const id = text(data.get("skuId"));
  const skuCode = text(data.get("skuCode"));
  const price = text(data.get("price"));
  const stockRaw = text(data.get("stockQuantity"));
  const optionsRaw = text(data.get("variantOptions"));
  const errors = {};
  if (skuCode && !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/.test(skuCode)) errors.skuCode = "invalidSku";
  if (!/^(?:\d{1,10})(?:\.\d{1,2})?$/.test(price) || Number(price) > 9999999999.99) errors.price = "invalidMoney";
  if (!/^(0|[1-9]\d{0,8})$/.test(stockRaw)) errors.stockQuantity = "invalidStock";
  let variantOptions = {};
  if (optionsRaw) {
    try {
      variantOptions = JSON.parse(optionsRaw);
      if (!variantOptions || Array.isArray(variantOptions) || typeof variantOptions !== "object" || Object.entries(variantOptions).length > 12 || Object.entries(variantOptions).some(([key, v]) => !key.trim() || key.length > 40 || !["string", "number", "boolean"].includes(typeof v) || String(v).length > 80)) throw new Error();
    } catch { errors.variantOptions = "invalidOptions"; }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { id, skuCode, price: Number(price).toFixed(2), stockQuantity: Number(stockRaw), variantOptions, isActive: data.get("isActive") === "on" } };
}

export function parseImage(data) {
  const imageId = text(data.get("imageId"));
  const urlText = text(data.get("url"));
  const providerPublicId = text(data.get("providerPublicId"));
  try {
    const url = new URL(urlText);
    if (url.protocol !== "https:" || url.username || url.password || urlText.length > 2048) return { ok: false };
    if (providerPublicId && (!/^farasha\/products\/[0-9a-f-]{36}$/i.test(providerPublicId) || url.hostname !== "res.cloudinary.com" || !url.pathname.includes(providerPublicId))) return { ok: false };
    return { ok: true, value: { imageId, url: url.href, providerPublicId: providerPublicId || null } };
  } catch { return { ok: false }; }
}
