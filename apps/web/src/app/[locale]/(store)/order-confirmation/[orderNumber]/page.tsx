import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, Container } from "@/components/ui";
import { OrderStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { formatMoney } from "@/lib/storefront/format";
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from "@/lib/storefront/order-labels";
import { storefrontMessages as messages } from "@/lib/storefront/messages";
import { getCurrentUser } from "@/lib/auth/authorization";
import { CheckoutAttemptCleanup } from "@/components/storefront/checkout-attempt-cleanup";
import { addressParts } from "@/lib/storefront/format";
import { VariantOptionsDisplay } from "@/components/storefront/variant-options-display";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const normalizedOrderNumber = orderNumber.toUpperCase();
  if (!/^(?:FAR-[A-F0-9]{32}|OF-[0-9A-HJKMNP-TV-Z]{13})$/.test(normalizedOrderNumber)) notFound();
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const order = await prisma.order.findUnique({
    where: { orderNumber: normalizedOrderNumber },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      paymentReceipt: { select: { orderId: true } },
      createdAt: true,
      subtotal: true,
      shippingCost: true,
      total: true,
      currency: true,
      userId: true,
      contactName: true,
      shippingAddress: true,
      items: { orderBy: { createdAt: "asc" }, select: { id: true, productNameSnapshot: true, variantSnapshot: true, unitPrice: true, quantity: true, subtotal: true } },
    },
  });
  if (!order || (order.userId !== null && order.userId !== userId)) notFound();
  const shippingAddress = addressParts(order.shippingAddress);

  return (
    <main className="store-main">
      <Container width="reading">
        <Card className="store-order-confirmation">
          <CheckoutAttemptCleanup />
          <Badge variant={order.status === OrderStatus.CANCELLED ? "error" : "success"}>{messages.ar.orderCreated}</Badge>
          <header className="store-page-heading">
            <h1>{messages.ar.orderConfirmation}</h1>
            <p>{messages.ar.orderNumber}: <strong dir="ltr">{order.orderNumber}</strong></p>
          </header>
          {!order.userId && <p className="store-muted">{messages.ar.orderCreatedForGuest}</p>}
          <p>{messages.ar.orderDate}: {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(order.createdAt)}</p>
          <p>{messages.ar.orderStatus}: <Badge>{orderStatusLabel(order.status)}</Badge></p>
          <p>{messages.ar.paymentStatus}: {paymentStatusLabel(order.paymentStatus)}</p>
          <p>{messages.ar.paymentMethodLabel}: {paymentMethodLabel(order.paymentMethod)}</p>
          {order.paymentReceipt && <Link href={`/api/orders/${encodeURIComponent(order.orderNumber)}/payment-receipt`} target="_blank">{messages.ar.paymentReceiptLink}</Link>}
          {order.paymentMethod === "BANK_TRANSFER" && <p className="store-muted">{messages.ar.transferPendingReview}</p>}
          <p>{messages.ar.contactName}: {order.contactName}</p>
          {shippingAddress.deliveryZoneName && <p>{messages.ar.deliveryZoneLabel}: {shippingAddress.deliveryZoneName}</p>}
          {shippingAddress.address && <p>{messages.ar.addressInfo}: {shippingAddress.address}{shippingAddress.city ? `، ${shippingAddress.city}` : ""}</p>}
          <h2>{messages.ar.orderedItems}</h2>
          <ul className="store-checkout-list">
            {order.items.map((item) => <li key={item.id}><span>{item.productNameSnapshot} × {item.quantity}<div className="flex flex-col gap-1 text-sm text-slate-500"><VariantOptionsDisplay options={item.variantSnapshot} /><span>{formatMoney(item.unitPrice, order.currency)} × {item.quantity}</span></div></span><strong>{formatMoney(item.subtotal, order.currency)}</strong></li>)}
          </ul>
          <p className="store-summary__row"><span>{messages.ar.subtotal}</span><strong>{formatMoney(order.subtotal, order.currency)}</strong></p>
          <p className="store-summary__row"><span>{messages.ar.shippingCost}</span><strong>{formatMoney(order.shippingCost, order.currency)}</strong></p>
          <p className="store-summary__row"><span>{messages.ar.total}</span><strong>{formatMoney(order.total, order.currency)}</strong></p>
          {order.paymentStatus === "UNPAID" && <p className="store-muted">{messages.ar.paymentUnpaidNotice}</p>}
          <Link href="/ar">{messages.ar.continueShopping}</Link>
        </Card>
      </Container>
    </main>
  );
}
import type { Metadata } from "next";
