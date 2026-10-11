import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, Container } from "@/components/ui";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { CheckoutRecovery } from "@/components/storefront/checkout-recovery";
import { isLocale } from "@/lib/i18n/config";
import { Prisma } from "@/generated/prisma/client";
import { formatMoney } from "@/lib/storefront/format";
import { VariantOptionsDisplay } from "@/components/storefront/variant-options-display";
import { getCartSnapshot, isCartLineAvailable } from "@/lib/storefront/cart";
import { getCurrentUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { getStoreCurrency } from "@/lib/storefront/orders";
import { checkoutOwnerBinding, createCheckoutAttemptToken } from "@/lib/storefront/checkout-security.mjs";
import { storefrontMessages as messages } from "@/lib/storefront/messages";
import { getBankTransferDetails } from "@/lib/storefront/payment-settings";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [cart, currency, user, settings] = await Promise.all([
    getCartSnapshot(),
    getStoreCurrency(),
    getCurrentUser(),
    prisma.storeSettings.findUnique({ where: { id: "singleton" }, select: { isActive: true, configuration: true } }),
  ]);
  const userId = user?.role === "CUSTOMER" ? user.id : null;
  const [defaultAddress, customer] = await Promise.all([
    userId ? prisma.customerAddress.findFirst({ where: { userId, isDefault: true } }) : Promise.resolve(null),
    userId ? prisma.customer.findUnique({ where: { userId }, select: { phone: true } }) : Promise.resolve(null),
  ]);
  if (user?.role === "ADMIN") redirect("/admin");
  const items = cart?.items ?? [];
  const available = items.length > 0 && items.every(isCartLineAvailable) && !!currency && settings?.isActive !== false;
  const subtotal = items.reduce((sum, item) => sum.add(item.sku.price.mul(item.quantity)), new Prisma.Decimal(0));
  const shippingCost = new Prisma.Decimal(0);
  const total = subtotal.add(shippingCost);
  const secret = process.env.AUTH_SECRET ?? "";
  const ownerBinding = userId ? checkoutOwnerBinding(secret, "customer", userId) : null;
  const checkoutAttempt = available && cart && currency && ownerBinding
    ? createCheckoutAttemptToken({
        secret,
        ownerBinding,
        cartId: cart.id,
        currency,
        items: items.map((item) => ({ skuId: item.sku.id, quantity: item.quantity, unitPrice: item.sku.price.toFixed(2) })),
      })
    : null;
  const canSubmit = userId !== null && available && checkoutAttempt !== null;
  const bankTransfer = getBankTransferDetails(settings?.configuration);

  return (
    <main className="store-main">
      <Container>
        <header className="store-page-heading"><h1>{messages.ar.checkoutTitle}</h1></header>
        {!userId ? (
          <Card className="mx-auto flex max-w-lg flex-col gap-4 p-6">
            <h2>{messages.ar.loginToOrder}</h2>
            <div className="flex flex-wrap gap-4"><Link className="underline" href="/ar/login?next=%2Far%2Fcheckout">{messages.ar.login}</Link><Link className="underline" href="/ar/register?next=%2Far%2Fcheckout">{messages.ar.register}</Link></div>
          </Card>
        ) : !canSubmit ? (
          <div className="ui-state">
            <span className="ui-state__symbol" aria-hidden="true">◇</span>
            {!items.length && <CheckoutRecovery />}
            <h2>{!items.length ? messages.ar.cartEmptyError : !currency ? messages.ar.currencyNotConfigured : settings?.isActive === false ? messages.ar.storeInactive : !checkoutAttempt ? messages.ar.checkoutUnavailable : messages.ar.cartInvalid}</h2>
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
              <p className="store-summary__row"><span>{messages.ar.shippingCost}</span><strong>{formatMoney(shippingCost, currency)}</strong></p>
              <p className="store-summary__row"><span>{messages.ar.total}</span><strong>{formatMoney(total, currency)}</strong></p>
              <p className="store-muted">{messages.ar.shippingUnconfigured}</p>
            </Card>
            <Card>
              <CheckoutForm
                checkoutToken={checkoutAttempt.token}
                quoteFingerprint={checkoutAttempt.fingerprint}
                checkoutExpiresAt={checkoutAttempt.expiresAt}
                contactName={defaultAddress?.fullName ?? user?.name ?? ""}
                contactEmail={user?.email ?? ""}
                contactPhone={defaultAddress?.phone ?? customer?.phone ?? ""}
                address={defaultAddress?.addressLine ?? ""}
                city={defaultAddress?.city ?? ""}
                bankTransfer={bankTransfer}
              />
            </Card>
          </div>
        )}
      </Container>
    </main>
  );
}
