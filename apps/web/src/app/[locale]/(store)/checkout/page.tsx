import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Container } from "@/components/ui";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { CheckoutRecovery } from "@/components/storefront/checkout-recovery";
import { isLocale } from "@/lib/i18n/config";
import { Prisma } from "@/generated/prisma/client";
import { formatMoney } from "@/lib/storefront/format";
import { VariantOptionsDisplay } from "@/components/storefront/variant-options-display";
import { getCartSnapshot, isCartLineAvailable, readCartTokenHash } from "@/lib/storefront/cart";
import { getCurrentUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { getStoreCurrency } from "@/lib/storefront/orders";
import { checkoutOwnerBinding, createCheckoutAttemptToken } from "@/lib/storefront/checkout-security.mjs";
import { storefrontMessages as messages } from "@/lib/storefront/messages";
import { getBankTransferDetails } from "@/lib/storefront/payment-settings";
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
  const [defaultAddress, customer] = await Promise.all([
    userId ? prisma.customerAddress.findFirst({ where: { userId, isDefault: true } }) : Promise.resolve(null),
    userId ? prisma.customer.findUnique({ where: { userId }, select: { phone: true } }) : Promise.resolve(null),
  ]);
  const guestTokenHash = userId ? null : await readCartTokenHash();
  const items = cart?.items ?? [];
  const available = items.length > 0 && items.every(isCartLineAvailable) && !!currency && settings?.isActive !== false;
  const subtotal = items.reduce((sum, item) => sum.add(item.sku.price.mul(item.quantity)), new Prisma.Decimal(0));
  const shippingSettings = settings?.shippingSettings;
  const deliveryZoneData = shippingSettings && typeof shippingSettings === "object" && !Array.isArray(shippingSettings) && "deliveryZones" in shippingSettings
    ? shippingSettings.deliveryZones
    : null;
  const deliveryZones = currency ? readDeliveryZones(deliveryZoneData).map((zone) => ({
    ...zone,
    priceLabel: formatMoney(zone.price, currency),
    totalLabel: formatMoney(subtotal.add(new Prisma.Decimal(zone.price)), currency),
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
                {items.map((item) => <li key={item.id}>
                  <span>{item.sku.product.translations[0]?.name} × {item.quantity}
                    <small className="block mt-1"><VariantOptionsDisplay options={item.sku.variantOptions} /></small>
                  </span>
                  <strong>{formatMoney(item.sku.price.mul(item.quantity), currency)}</strong>
                </li>)}
              </ul>
              <p className="store-summary__row"><span>{messages.ar.subtotal}</span><strong>{formatMoney(subtotal, currency)}</strong></p>
            </Card>
            <Card>
              <CheckoutForm
                checkoutToken={checkoutAttempt.token}
                quoteFingerprint={checkoutAttempt.fingerprint}
                checkoutExpiresAt={checkoutAttempt.expiresAt}
                contactName={userId ? defaultAddress?.fullName ?? user?.name ?? "" : ""}
                contactPhone={defaultAddress?.phone ?? customer?.phone ?? ""}
                address={defaultAddress?.addressLine ?? ""}
                city={defaultAddress?.city ?? ""}
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
