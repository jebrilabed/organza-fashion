import assert from "node:assert/strict";
import test from "node:test";
import { defaultHomeEditorialCopy, parseAddress, parseDeliveryZones, parseHomeEditorialCopy, parseHomeEditorialImages, parseImage, parseRegistration, parseSku, parseStoreSettings, readDeliveryZones, readHomeEditorialCopy, supportedCurrencies } from "../src/lib/phase7/validation.mjs";
import { checkEnvironment } from "../src/lib/config/environment-readiness.mjs";
import { parseCategoryInput, parseProductInput } from "../src/lib/admin/catalog-validation.mjs";

function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("registration normalizes phone and never accepts a client role", () => {
  const parsed = parseRegistration(form({ name: " Sara ", phone: "055 123 4567", addressLine: "Street 1", city: "Riyadh", password: "Pass1234", confirmation: "Pass1234", role: "ADMIN" }));
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value, { name: "Sara", phone: "0551234567", addressLine: "Street 1", city: "Riyadh", password: "Pass1234" });
  assert.equal("role" in parsed.value, false);
});

test("registration accepts Arabic and Persian numerals in mobile numbers", () => {
  const parsed = parseRegistration(form({ name: "Sara", phone: "٠٥٥ ۱۲۳ ٤٥٦٧", addressLine: "Street 1", city: "Riyadh", password: "Pass1234", confirmation: "Pass1234" }));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.phone, "0551234567");
});

test("registration rejects short or mismatched passwords", () => {
  assert.equal(parseRegistration(form({ name: "Sara", password: "short", confirmation: "different" })).ok, false);
  assert.equal(parseRegistration(form({ name: "Sara", password: "Pass123", confirmation: "Pass123" })).ok, false);
});

test("customer address validation requires bounded contact and location data", () => {
  const parsed = parseAddress(form({ fullName: "Sara", phone: "+966 500000000", addressLine: "Street 1", city: "Riyadh", isDefault: "on" }));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.isDefault, true);
  assert.equal(parseAddress(form({ fullName: "", phone: "x", addressLine: "", city: "" })).ok, false);
});

test("store settings always use Israeli shekels and Arabic locale", () => {
  const base = { storeName: "Farasha", currency: "SAR", defaultLocale: "ar", isActive: "on" };
  assert.equal(parseStoreSettings(form(base)).ok, true);
  assert.equal(parseStoreSettings(form({ ...base, currency: "BAD" })).value.currency, "ILS");
  assert.equal(parseStoreSettings(form({ ...base, currency: "ILS" })).value.currency, "ILS");
  assert.deepEqual(supportedCurrencies, ["SAR", "USD", "EUR", "ILS", "JOD"]);
});

test("homepage editorial images accept only bounded, unique Cloudinary uploads", () => {
  const first = { url: "https://res.cloudinary.com/demo/image/upload/v1/farasha/products/550e8400-e29b-41d4-a716-446655440000.jpg", providerPublicId: "farasha/products/550e8400-e29b-41d4-a716-446655440000" };
  const second = { url: "https://res.cloudinary.com/demo/image/upload/v1/farasha/products/550e8400-e29b-41d4-a716-446655440001.jpg", providerPublicId: "farasha/products/550e8400-e29b-41d4-a716-446655440001" };
  assert.deepEqual(parseHomeEditorialImages(form({ homeEditorialImages: JSON.stringify([first, second]) })), { ok: true, value: [first, second] });
  assert.equal(parseHomeEditorialImages(form({ homeEditorialImages: JSON.stringify([{ ...first, url: first.url.replace("https:", "http:") }]) })).ok, false);
  assert.equal(parseHomeEditorialImages(form({ homeEditorialImages: JSON.stringify([first, first]) })).ok, false);
  assert.equal(parseHomeEditorialImages(form({ homeEditorialImages: JSON.stringify(Array(9).fill(first)) })).ok, false);
});

test("homepage editorial copy defaults to current text and validates admin edits", () => {
  const copy = { eyebrow: "من دار organza fashion", title: "تفاصيل جديدة", description: "وصف القسم", ctaLabel: "تسوقي الآن" };
  assert.deepEqual(readHomeEditorialCopy(null), defaultHomeEditorialCopy);
  assert.deepEqual(parseHomeEditorialCopy(form({ homeEditorialEyebrow: copy.eyebrow, homeEditorialTitle: copy.title, homeEditorialDescription: copy.description, homeEditorialCtaLabel: copy.ctaLabel })), { ok: true, value: copy });
  assert.equal(parseHomeEditorialCopy(form({ homeEditorialTitle: "x".repeat(161) })).ok, false);
});

test("delivery zones normalize prices and reject duplicate or invalid rows", () => {
  const data = new FormData();
  data.append("deliveryZoneName", " رام الله ");
  data.append("deliveryZonePrice", "7.5");
  data.append("deliveryZoneName", "القدس");
  data.append("deliveryZonePrice", "0");
  assert.deepEqual(parseDeliveryZones(data), {
    ok: true,
    value: [{ name: "رام الله", price: "7.50" }, { name: "القدس", price: "0.00" }],
  });

  const duplicate = new FormData();
  duplicate.append("deliveryZoneName", "رام الله");
  duplicate.append("deliveryZonePrice", "7");
  duplicate.append("deliveryZoneName", " رام الله ");
  duplicate.append("deliveryZonePrice", "8");
  assert.equal(parseDeliveryZones(duplicate).ok, false);

  const invalidPrice = new FormData();
  invalidPrice.append("deliveryZoneName", "نابلس");
  invalidPrice.append("deliveryZonePrice", "-1");
  assert.equal(parseDeliveryZones(invalidPrice).ok, false);
  assert.deepEqual(readDeliveryZones([{ name: "نابلس", price: "3.25" }, { name: "x", price: "bad" }]), []);
});

test("delivery and SKU prices accept Arabic and Persian numerals", () => {
  const zones = new FormData();
  zones.append("deliveryZoneName", "رام الله");
  zones.append("deliveryZonePrice", "٧٫٥۰");
  assert.deepEqual(parseDeliveryZones(zones), {
    ok: true,
    value: [{ name: "رام الله", price: "7.50" }],
  });

  const sku = parseSku(form({ skuCode: "DRESS-RED", price: "١٠٫٥٠", stockQuantity: "4", variantOptions: "{}" }));
  assert.equal(sku.ok, true);
  assert.equal(sku.value.price, "10.50");
});

test("SKU validation blocks negative values and malformed variant JSON", () => {
  const base = { skuCode: "DRESS-RED", price: "10.50", stockQuantity: "4", variantOptions: '{"color":"red"}', isActive: "on" };
  assert.equal(parseSku(form(base)).ok, true);
  assert.equal(parseSku(form({ ...base, stockQuantity: "-1" })).ok, false);
  assert.equal(parseSku(form({ ...base, price: "-1" })).ok, false);
  assert.equal(parseSku(form({ ...base, variantOptions: "[]" })).ok, false);
});

test("product images require credential-free HTTPS URLs", () => {
  assert.equal(parseImage(form({ url: "https://cdn.example.com/product.jpg", altText: "Dress" })).ok, true);
  assert.equal(parseImage(form({ url: "http://cdn.example.com/product.jpg" })).ok, false);
  assert.equal(parseImage(form({ url: "https://user:pass@example.com/product.jpg" })).ok, false);
});

test("product and category SEO fields are saved as bounded plain text", () => {
  const product = parseProductInput(form({
    nameAr: "فستان", slug: "dress", skuCode: "DRESS-1", price: "10", stockQuantity: "2",
    seoTitleAr: "عنوان مناسب", seoDescriptionAr: "وصف مناسب", seoTitleEn: "Dress title", seoDescriptionEn: "Dress description",
  }));
  assert.equal(product.ok, true);
  assert.equal(product.value.seoTitleEn, "Dress title");
  assert.equal(parseProductInput(form({ nameAr: "فستان", slug: "dress", skuCode: "DRESS-1", price: "10", stockQuantity: "2", seoTitleAr: "x".repeat(181) })).ok, false);
  const category = parseCategoryInput(form({ nameAr: "ملابس", slug: "clothes", seoTitleAr: "عنوان التصنيف", seoDescriptionAr: "وصف التصنيف" }));
  assert.equal(category.ok, true);
  assert.equal(category.value.seoDescriptionAr, "وصف التصنيف");
  assert.equal(parseCategoryInput(form({ nameAr: "ملابس", slug: "clothes", seoDescriptionEn: "x".repeat(501) })).ok, false);
});

test("production environment validation reports configuration only, never secret values", () => {
  const incomplete = checkEnvironment({ NODE_ENV: "production", DATABASE_URL: "", AUTH_SECRET: "short" });
  assert.equal(incomplete.length >= 2, true);
  assert.equal(incomplete.some((issue) => issue.includes("short")), false);
  assert.deepEqual(checkEnvironment({ NODE_ENV: "production", DATABASE_URL: "postgresql://db.example/farasha", AUTH_SECRET: "x".repeat(40), SITE_URL: "https://farasha.example" }), []);
});
