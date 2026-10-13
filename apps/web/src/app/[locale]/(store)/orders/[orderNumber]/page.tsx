import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, Card, Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { addressParts, formatMoney } from "@/lib/storefront/format";
import { VariantOptionsDisplay } from "@/components/storefront/variant-options-display";
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from "@/lib/storefront/order-labels";
import { storefrontMessages as messages } from "@/lib/storefront/messages";
import { ExchangeRequestStatus } from "@/generated/prisma/enums";
import { checkExchangeEligibility } from "@/lib/storefront/exchange-policy.mjs";
import { ExchangeRequestForm } from "@/components/storefront/exchange-request-form";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MyOrderDetails({ params }: { params: Promise<{ orderNumber: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/ar/login");
  const { orderNumber } = await params;
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: user.id },
    select: {
      orderNumber: true,
      status: true,
      deliveredAt: true,
      paymentStatus: true,
      paymentMethod: true,
      paymentReceipt: { select: { orderId: true } },
      createdAt: true,
      subtotal: true,
      shippingCost: true,
      discountTotal: true,
      total: true,
      currency: true,
      shippingAddress: true,
      items: { orderBy: { createdAt: "asc" }, select: {
        id: true,
        productNameSnapshot: true,
        variantSnapshot: true,
        unitPrice: true,
        quantity: true,
        subtotal: true,
        isSaleSnapshot: true,
        exchangeRequests: { orderBy: { createdAt: "desc" }, select: { id: true, status: true, createdAt: true } },
      } },
    },
  });
  if (!order) notFound();
  const shippingAddress = addressParts(order.shippingAddress);

  return (
    <main className="store-main">
      <Container width="reading">
        <Link href="/ar/orders">{messages.ar.backToOrders}</Link>
        <Card className="store-order-confirmation">
          <header className="store-page-heading"><h1>{order.orderNumber}</h1><p>{messages.ar.orderDate}: {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(order.createdAt)}</p></header>
          <p>{messages.ar.orderStatus}: <Badge>{orderStatusLabel(order.status)}</Badge></p>
          <p>{messages.ar.paymentStatus}: {paymentStatusLabel(order.paymentStatus)}</p>
          <p>{messages.ar.paymentMethodLabel}: {paymentMethodLabel(order.paymentMethod)}</p>
          {order.paymentReceipt && <Link href={`/api/orders/${encodeURIComponent(order.orderNumber)}/payment-receipt`} target="_blank">{messages.ar.paymentReceiptLink}</Link>}
          {shippingAddress.deliveryZoneName && <p>{messages.ar.deliveryZoneLabel}: {shippingAddress.deliveryZoneName}</p>}
          {shippingAddress.address && <p>{messages.ar.addressInfo}: {shippingAddress.address}{shippingAddress.city ? `، ${shippingAddress.city}` : ""}</p>}
          <h2>{messages.ar.orderedItems}</h2>
          <div className="store-order-items-table-wrap" role="region" aria-label={messages.ar.orderedItems} tabIndex={0}>
            <table className="store-order-items-table">
              <thead><tr><th>{messages.ar.product}</th><th>{messages.ar.price}</th><th>{messages.ar.quantity}</th><th>{messages.ar.lineTotal}</th></tr></thead>
              <tbody>{order.items.map((item) => <tr key={item.id}>
                <td>{item.productNameSnapshot}<div className="mt-1"><VariantOptionsDisplay options={item.variantSnapshot} /></div></td>
                <td>{formatMoney(item.unitPrice, order.currency)}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.subtotal, order.currency)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          {order.status === "DELIVERED" && <section className="mt-6 grid gap-5" aria-labelledby="exchange-request-heading">
            <h2 id="exchange-request-heading">طلبات التبديل</h2>
            {order.items.map((item) => {
              const latestRequest = item.exchangeRequests[0];
              const activeRequest = item.exchangeRequests.find((request) => request.status !== ExchangeRequestStatus.REJECTED);
              const eligibility = checkExchangeEligibility({ orderStatus: order.status, deliveredAt: order.deliveredAt, isSaleItem: item.isSaleSnapshot });
              return <div className="grid gap-3 border-b border-[var(--border-subtle)] pb-4" key={item.id}>
                <h3>{item.productNameSnapshot}</h3>
                {activeRequest ? <p className="store-muted">طلب التبديل: {activeRequest.status === ExchangeRequestStatus.PENDING ? "قيد المراجعة" : activeRequest.status === ExchangeRequestStatus.APPROVED ? "تمت الموافقة" : "اكتمل التبديل"}</p>
                  : eligibility.eligible ? <ExchangeRequestForm maxQuantity={item.quantity} orderItemId={item.id} />
                    : <p className="store-muted">{eligibility.reason === "sale-item" ? "قطع العرض غير مشمولة بالتبديل." : "انتهت مهلة التبديل البالغة 12 ساعة من التسليم."}</p>}
                {latestRequest?.status === ExchangeRequestStatus.REJECTED && <p className="store-alert">تم رفض طلب التبديل السابق. يمكنك تقديم طلب جديد ما دمت ضمن المهلة.</p>}
              </div>;
            })}
          </section>}
          <p className="store-summary__row"><span>{messages.ar.subtotal}</span><strong>{formatMoney(order.subtotal, order.currency)}</strong></p>
          <p className="store-summary__row"><span>{messages.ar.shippingCost}</span><strong>{formatMoney(order.shippingCost, order.currency)}</strong></p>
          {order.discountTotal.greaterThan(0) && <p className="store-summary__row"><span>{messages.ar.fifthOrderDiscount}</span><strong>-{formatMoney(order.discountTotal, order.currency)}</strong></p>}
          <p className="store-summary__row"><span>{messages.ar.total}</span><strong>{formatMoney(order.total, order.currency)}</strong></p>
        </Card>
      </Container>
    </main>
  );
}
import type { Metadata } from "next";
