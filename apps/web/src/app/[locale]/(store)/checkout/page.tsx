import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Container } from "@/components/ui";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { CheckoutRecovery } from "@/components/storefront/checkout-recovery";
import { SafeProductImage } from "@/components/storefront/safe-product-image";
import { isLocale } from "@/lib/i18n/config";
import { OrderStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { addressParts, formatMoney } from "@/lib/storefront/format";
import { VariantOptionsDisplay } from "@/components/storefront/variant-options-display";
import { getCartSnapshot, isCartLineAvailable, readCartTokenHash } from "@/lib/storefront/cart";
import { getCurrentUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { getStoreCurrency } from "@/lib/storefront/orders";
import { checkoutOwnerBinding, createCheckoutAttemptToken } from "@/lib/storefront/checkout-security.mjs";
import { storefrontMessages as messages } from "@/lib/storefront/messages";
import { getBankTransferDetails } from "@/lib/storefront/payment-settings";
import { calculateFifthOrderDiscount } from "@/lib/storefront/checkout-pricing.mjs";
import { readDeliveryZones } from "@/lib/phase7/validation.mjs";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [cart, currency, user, settings] = await Promise.all([
    getCartSnapshot(),
    getStoreCurrency(),
    getCurrentUser(),
    prisma.storeSettings.findUnique({ where: { id: "singleton" }, select: { isActive: true, configuration: true, shippingSettings: true } }),
  ]);
  const userId = user?.id ?? null;
  const [defaultAddress, customer, previousOrderCount, lastOrder] = await Promise.all([
    userId ? prisma.customerAddress.findFirst({ where: { userId, isDefault: true } }) : Promise.resolve(null),
    userId ? prisma.customer.findUnique({ where: { userId }, select: { phone: true, name: true } }) : Promise.resolve(null),
    userId ? prisma.order.count({ where: { userId, status: { not: OrderStatus.CANCELLED } } }) : Promise.resolve(0),
    // Fetch the most recent order to reuse shipping info when no default address is saved
    userId ? prisma.order.findFirst({
      where: { userId, status: { not: OrderStatus.CANCELLED } },
      orderBy: { createdAt: "desc" },
      select: { contactName: true, contactPhone: true, shippingAddress: true },
    }) : Promise.resolve(null),
  ]);
  const guestTokenHash = userId ? null : await readCartTokenHash();
  const items = cart?.items ?? [];
  const available = items.length > 0 && items.every(isCartLineAvailable) && !!currency && settings?.isActive !== false;
  const subtotal = items.reduce((sum, item) => sum.add(item.sku.price.mul(item.quantity)), new Prisma.Decimal(0));
  const discountTotal = new Prisma.Decimal(calculateFifthOrderDiscount(subtotal.toFixed(2), previousOrderCount));
  const shippingSettings = settings?.shippingSettings;
  const deliveryZoneData = shippingSettings && typeof shippingSettings === "object" && !Array.isArray(shippingSettings) && "deliveryZones" in shippingSettings
    ? shippingSettings.deliveryZones
    : null;
  const deliveryZones = currency ? readDeliveryZones(deliveryZoneData).map((zone) => ({
    ...zone,
    priceLabel: formatMoney(zone.price, currency),
    discountLabel: discountTotal.greaterThan(0) ? formatMoney(discountTotal, currency) : null,
    totalLabel: formatMoney(subtotal.add(new Prisma.Decimal(zone.price)).sub(discountTotal), currency),
  })) : [];
  const secret = process.env.AUTH_SECRET ?? "";
  const ownerBinding = userId
    ? checkoutOwnerBinding(secret, "customer", userId)
    : guestTokenHash ? checkoutOwnerBinding(secret, "guest", guestTokenHash) : null;
  const checkoutAttempt = available && cart && currency && ownerBinding
    ? createCheckoutAttemptToken({
        secret,
        ownerBinding,
        cartId: cart.id,
        currency,
        items: items.map((item) => ({ skuId: item.sku.id, quantity: item.quantity, unitPrice: item.sku.price.toFixed(2) })),
      })
    : null;
  const canSubmit = available && checkoutAttempt !== null && deliveryZones.length > 0;
  const bankTransfer = getBankTransferDetails(settings?.configuration);

  // ── Auto-fill priority: defaultAddress → lastOrder → user/customer profile ──
  const lastOrderAddress = lastOrder ? addressParts(lastOrder.shippingAddress) : null;
  const prefillName = userId
    ? (defaultAddress?.fullName || lastOrder?.contactName || customer?.name || user?.name || "")
    : "";
  const prefillPhone = defaultAddress?.phone
    || lastOrder?.contactPhone
    || customer?.phone
    || user?.phone
    || "";
  const prefillAddress = defaultAddress?.addressLine
    || lastOrderAddress?.address
    || "";
  const prefillCity = defaultAddress?.city
    || lastOrderAddress?.city
    || "";

  return (
    <main className="store-main">
      <Container>
        <header className="store-page-heading"><h1>{messages.ar.checkoutTitle}</h1></header>
        {!canSubmit ? (
          <div className="ui-state">
            <span className="ui-state__symbol" aria-hidden="true">◇</span>
            {!items.length && <CheckoutRecovery />}
            <h2>{!items.length ? messages.ar.cartEmptyError : !currency ? messages.ar.currencyNotConfigured : settings?.isActive === false ? messages.ar.storeInactive : !deliveryZones.length ? messages.ar.deliveryUnavailable : !checkoutAttempt ? messages.ar.checkoutUnavailable : messages.ar.cartInvalid}</h2>
            <Link href="/ar/cart">{messages.ar.cartTitle}</Link>
          </div>
        ) : (
          <div className="store-columns">
            <Card>
              <h2>{messages.ar.orderedItems}</h2>
              <ul className="store-checkout-list">
                {items.map((item) => {
                  const variantOptions = item.sku.variantOptions;
                  const colorImageUrl = variantOptions && typeof variantOptions === "object" && !Array.isArray(variantOptions) &&
                    typeof variantOptions.ColorImageUrl === "string" ? variantOptions.ColorImageUrl : null;
                  const image = item.sku.product.images[0];
                  const productName = item.sku.product.translations[0]?.name ?? messages.ar.product;
                  return (
                    <li className="store-checkout-list__item" key={item.id}>
                      <div className="store-checkout-item">
                        <div className="store-checkout-item__image">
                          {colorImageUrl || image ? <SafeProductImage alt={image?.altText || productName} sizes="64px" src={colorImageUrl ?? image!.url} /> : <span>{messages.ar.noImage}</span>}
                        </div>
                        <div className="store-checkout-item__details">
                          <span>{productName} × {item.quantity}</span>
                          <small><VariantOptionsDisplay options={item.sku.variantOptions} /></small>
                        </div>
                      </div>
                      <strong>{formatMoney(item.sku.price.mul(item.quantity), currency)}</strong>
                    </li>
                  );
                })}
              </ul>
              <p className="store-summary__row"><span>{messages.ar.subtotal}</span><strong>{formatMoney(subtotal, currency)}</strong></p>
            </Card>
            <Card>
              {!userId && <p className="store-muted">خصم الطلب الخامس متاح للعملاء المسجلين، وتُحتسب الطلبات المرتبطة بالحساب فقط. <Link href="/ar/login">سجّل الدخول</Link>.</p>}
              <CheckoutForm
                checkoutToken={checkoutAttempt.token}
                quoteFingerprint={checkoutAttempt.fingerprint}
                checkoutExpiresAt={checkoutAttempt.expiresAt}
                contactName={prefillName}
                contactPhone={prefillPhone}
                address={prefillAddress}
                city={prefillCity}
                bankTransfer={bankTransfer}
                deliveryZones={deliveryZones}
              />
            </Card>
          </div>
        )}
      </Container>
    </main>
  );
}
