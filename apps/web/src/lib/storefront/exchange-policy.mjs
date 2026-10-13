const EXCHANGE_WINDOW_MS = 12 * 60 * 60 * 1000;
const text = (value) => typeof value === "string" ? value.trim() : "";

export function checkExchangeEligibility({ orderStatus, deliveredAt, isSaleItem }, now = Date.now()) {
  if (orderStatus !== "DELIVERED" || !deliveredAt) return { eligible: false, reason: "not-delivered" };
  if (isSaleItem) return { eligible: false, reason: "sale-item" };
  const deliveredTime = new Date(deliveredAt).getTime();
  if (!Number.isFinite(deliveredTime) || deliveredTime > now || now - deliveredTime > EXCHANGE_WINDOW_MS) {
    return { eligible: false, reason: "outside-window" };
  }
  return { eligible: true, expiresAt: deliveredTime + EXCHANGE_WINDOW_MS };
}

export function parseExchangeRequestInput(formData, maxQuantity) {
  const orderItemId = text(formData.get("orderItemId"));
  const quantityRaw = text(formData.get("quantity"));
  const reason = text(formData.get("reason"));
  const errors = {};
  const quantity = /^(?:[1-9]\d{0,3})$/.test(quantityRaw) ? Number(quantityRaw) : null;
  if (!orderItemId || orderItemId.length > 64) errors.orderItemId = "invalid-item";
  if (quantity === null || quantity > maxQuantity) errors.quantity = "invalid-quantity";
  if (!reason || reason.length > 1000) errors.reason = "invalid-reason";
  if (formData.get("invoiceConfirmed") !== "on") errors.invoiceConfirmed = "invoice-required";
  if (formData.get("deliveryFeeAccepted") !== "on") errors.deliveryFeeAccepted = "delivery-fee-required";
  return Object.keys(errors).length ? { ok: false, errors } : {
    ok: true,
    value: { orderItemId, quantity, reason, invoiceConfirmed: true, deliveryFeeAccepted: true },
  };
}