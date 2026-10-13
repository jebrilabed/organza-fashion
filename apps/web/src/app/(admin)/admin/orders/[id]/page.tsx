import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/authorization";
import { Badge, Button, Card, Container, Select } from "@/components/ui";
import { DeleteOrderForm } from "@/components/admin/delete-order-form";
import { ToastMessage } from "@/components/ui/toast";
import { SafeProductImage } from "@/components/storefront/safe-product-image";
import { VariantOptionsDisplay } from "@/components/storefront/variant-options-display";
import { ExchangeRequestStatus, OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { adminMessages } from "@/lib/admin/messages";
import { availableAdminOrderStatuses } from "@/lib/storefront/order-workflow.mjs";
import { addressParts, formatMoney } from "@/lib/storefront/format";
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from "@/lib/storefront/order-labels";
import { storefrontMessages as messages } from "@/lib/storefront/messages";
import { InlineStatusSelect } from "@/components/admin/order-status-select";
import { updateExchangeRequestStatusAction, updateOrderStatusAction, updatePaymentStatusAction } from "../actions";

export default async function AdminOrderDetails({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; errorMsg?: string }>;
}) {
  await requireAdminPage();
  const [{ id }, { notice, errorMsg }] = await Promise.all([params, searchParams]);
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      paymentReceipt: { select: { orderId: true } },
      exchangeRequests: { orderBy: { createdAt: "desc" }, select: {
        id: true,
        requestedQuantity: true,
        reason: true,
        invoiceConfirmed: true,
        deliveryFeeAccepted: true,
        status: true,
        createdAt: true,
        orderItem: { select: { productNameSnapshot: true } },
      } },
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      shippingAddress: true,
      customerNote: true,
      currency: true,
      subtotal: true,
      shippingCost: true,
      discountTotal: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      items: { orderBy: { createdAt: "asc" }, select: {
        id: true,
        productNameSnapshot: true,
        productImageSnapshot: true,
        variantSnapshot: true,
        unitPrice: true,
        quantity: true,
        subtotal: true,
        sku: {
          select: {
            product: {
              select: {
                images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 1, select: { url: true } },
              },
            },
          },
        },
      } },
    },
  });
  if (!order) notFound();
  const address = addressParts(order.shippingAddress);
  const availableStatuses = availableAdminOrderStatuses(order.status) as OrderStatus[];
  const adminText = adminMessages.ar;

  // Build options: always include current status + available transitions
  const orderStatusOptions = [
    { value: order.status, label: orderStatusLabel(order.status) },
    ...availableStatuses
      .filter((s) => s !== order.status)
      .map((s) => ({ value: s, label: orderStatusLabel(s) })),
  ];

  const paymentStatusOptions = Object.values(PaymentStatus).map((s) => ({
    value: s,
    label: paymentStatusLabel(s),
  }));

  return (
    <Container className="admin-content">
      <header className="admin-page-header"><div><p className="admin-eyebrow">{messages.ar.adminOrders}</p><h1 dir="ltr">{order.orderNumber}</h1><p><Badge>{orderStatusLabel(order.status)}</Badge></p></div><div className="admin-order-header-actions"><DeleteOrderForm orderId={order.id} label={adminText.deleteOrder} confirmMessage={adminText.deleteOrderConfirm} /><Link href="/admin/orders">{messages.ar.backToAdminOrders}</Link></div></header>
      <ToastMessage cleanUrl message={notice === "updated" ? messages.ar.statusUpdated : notice === "paymentUpdated" ? messages.ar.paymentStatusUpdated : notice === "exchangeUpdated" ? "تم تحديث طلب التبديل." : undefined} tone="success" />
      <ToastMessage cleanUrl message={errorMsg || (notice === "transition" ? messages.ar.invalidTransition : notice === "missingSku" ? messages.ar.missingSkuRestore : notice === "alreadyCancelled" ? messages.ar.alreadyCancelled : notice === "restockUnavailable" ? messages.ar.restockUnavailable : notice === "reserveUnavailable" ? messages.ar.reserveUnavailable : notice === "paymentInvalid" ? messages.ar.paymentStatusInvalid : notice === "paymentUpdateFailed" ? messages.ar.paymentStatusUpdateFailed : notice === "deleteMissingSku" ? adminText.orderDeleteMissingSku : notice === "deleteRestockUnavailable" ? adminText.orderDeleteRestockUnavailable : notice === "deleteNotificationProcessing" ? adminText.orderDeleteNotificationProcessing : notice === "deleteFailed" ? adminText.orderDeleteFailed : notice === "notFound" ? messages.ar.orderNotFound : notice && notice !== "updated" && notice !== "paymentUpdated" ? messages.ar.databaseUnavailable : undefined)} tone="error" />
      <div className="store-admin-order-info">
        <Card><h2>{messages.ar.customer}</h2><p>{order.contactName}</p><p dir="ltr">{order.contactPhone}</p>{order.contactEmail && <p dir="ltr">{order.contactEmail}</p>}</Card>
        <Card><h2>{messages.ar.addressInfo}</h2><p>{address.deliveryZoneName && <>{messages.ar.deliveryZoneLabel}: {address.deliveryZoneName}<br /></>}</p><p>{address.address}</p><p>{address.city}</p></Card>
        <Card>
          <h2>{messages.ar.adminOrderDetails}</h2>
          <p>{messages.ar.orderDate}: {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(order.createdAt)}</p>
          <p>{messages.ar.orderDateUpdated}: {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(order.updatedAt)}</p>
          <div className="admin-order-detail-status-row">
            <span className="admin-order-detail-status-label">{messages.ar.orderStatus}</span>
            <InlineStatusSelect
              action={updateOrderStatusAction}
              defaultValue={order.status}
              fieldName="status"
              options={orderStatusOptions}
              orderId={order.id}
            />
          </div>
          <div className="admin-order-detail-status-row">
            <span className="admin-order-detail-status-label">{messages.ar.paymentStatus}</span>
            <InlineStatusSelect
              action={updatePaymentStatusAction}
              defaultValue={order.paymentStatus}
              fieldName="paymentStatus"
              options={paymentStatusOptions}
              orderId={order.id}
            />
          </div>
          <p>{messages.ar.paymentMethodLabel}: {paymentMethodLabel(order.paymentMethod)}</p>
          {order.paymentReceipt && <Link href={`/api/orders/${encodeURIComponent(order.orderNumber)}/payment-receipt`} target="_blank">{messages.ar.paymentReceiptLink}</Link>}
        </Card>
        <Card><h2>{messages.ar.customerNote}</h2><p>{order.customerNote || messages.ar.noNotes}</p></Card>
      </div>
      {order.exchangeRequests.length > 0 && <Card>
        <h2>طلبات التبديل</h2>
        <div className="grid gap-4">
          {order.exchangeRequests.map((request) => <section className="grid gap-2 border-b border-[var(--border-subtle)] pb-4 last:border-0" key={request.id}>
            <h3>{request.orderItem.productNameSnapshot} × {request.requestedQuantity}</h3>
            <p>السبب: {request.reason}</p>
            <p>الفاتورة مؤكدة: {request.invoiceConfirmed ? "نعم" : "لا"} · رسوم التوصيل مقبولة: {request.deliveryFeeAccepted ? "نعم" : "لا"}</p>
            <p>الحالة: {request.status === ExchangeRequestStatus.PENDING ? "قيد المراجعة" : request.status === ExchangeRequestStatus.APPROVED ? "تمت الموافقة" : request.status === ExchangeRequestStatus.REJECTED ? "مرفوض" : "مكتمل"}</p>
            <p>{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(request.createdAt)}</p>
            {(request.status === ExchangeRequestStatus.PENDING || request.status === ExchangeRequestStatus.APPROVED) && <form action={updateExchangeRequestStatusAction} className="admin-form__actions">
              <input name="requestId" type="hidden" value={request.id} />
              <Select label="تحديث حالة التبديل" name="status" defaultValue={request.status === ExchangeRequestStatus.PENDING ? "APPROVED" : "COMPLETED"}>
                {request.status === ExchangeRequestStatus.PENDING ? <><option value="APPROVED">موافقة</option><option value="REJECTED">رفض</option></> : <option value="COMPLETED">إكمال التبديل</option>}
              </Select>
              <Button type="submit">حفظ الحالة</Button>
            </form>}
          </section>)}
        </div>
      </Card>}
      <Card className="admin-order-items-card">
        <h2>{messages.ar.orderedItems}</h2>
        <div className="ui-table-wrap admin-order-items-table-wrap" role="region" aria-label={messages.ar.orderedItems} tabIndex={0}>
          <table className="ui-table admin-order-items-table">
            <thead><tr><th>{messages.ar.product}</th><th>{messages.ar.quantity}</th><th>{messages.ar.price}</th><th>{messages.ar.lineTotal}</th></tr></thead>
            <tbody>{order.items.map((item) => {
              const imageUrl = item.productImageSnapshot ?? item.sku?.product.images[0]?.url;
              return <tr key={item.id}>
              <td data-label={messages.ar.product}><div className="admin-order-item-product">
                {imageUrl ? <SafeProductImage alt={item.productNameSnapshot} className="admin-order-item-product__image" sizes="64px" src={imageUrl} /> : <span className="admin-order-item-product__empty">{messages.ar.noImage}</span>}
                <div><strong>{item.productNameSnapshot}</strong><VariantOptionsDisplay options={item.variantSnapshot} /></div>
              </div></td>
              <td data-label={messages.ar.quantity}>{item.quantity}</td>
              <td data-label={messages.ar.price}>{formatMoney(item.unitPrice, order.currency)}</td>
              <td data-label={messages.ar.lineTotal}>{formatMoney(item.subtotal, order.currency)}</td>
            </tr>;
            })}</tbody>
          </table>
        </div>
        <div className="admin-order-totals">
          <p className="admin-order-total"><span>{messages.ar.subtotal}</span><strong>{formatMoney(order.subtotal, order.currency)}</strong></p>
          <p className="admin-order-total"><span>{messages.ar.shippingCost}</span><strong>{formatMoney(order.shippingCost, order.currency)}</strong></p>
          {order.discountTotal.greaterThan(0) && <p className="admin-order-total"><span>{messages.ar.fifthOrderDiscount}</span><strong>-{formatMoney(order.discountTotal, order.currency)}</strong></p>}
          <p className="admin-order-total admin-order-total--grand"><span>{messages.ar.total}</span><strong>{formatMoney(order.total, order.currency)}</strong></p>
        </div>
      </Card>
    </Container>
  );
}
