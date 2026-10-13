"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ExchangeRequestStatus, NotificationStatus, OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { AuthorizationDeniedError, AuthenticationRequiredError, requireAdmin } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { changeOrderStatus, StorefrontOperationError } from "@/lib/storefront/orders";
import { diagnoseDatabaseError } from "@/lib/db/database-error.mjs";

class OrderDeletionError extends Error {
  constructor(readonly notice: "deleteMissingSku" | "deleteRestockUnavailable") {
    super(notice);
    this.name = "OrderDeletionError";
  }
}

function safeOrdersListReturnPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const base = new URL("https://organza.invalid");
    const url = new URL(value, base);
    if (url.origin !== base.origin || url.pathname !== "/admin/orders" || url.hash) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function orderStatusDestination(orderId: string, notice: string, returnTo: string | null, errorMsg?: string) {
  if (!returnTo) {
    const url = new URL(`/admin/orders/${encodeURIComponent(orderId)}`, "https://organza.invalid");
    url.searchParams.set("notice", notice);
    if (errorMsg) url.searchParams.set("errorMsg", errorMsg);
    return `${url.pathname}${url.search}`;
  }
  const url = new URL(returnTo, "https://organza.invalid");
  url.searchParams.set("notice", notice);
  if (errorMsg) url.searchParams.set("errorMsg", errorMsg);
  return `${url.pathname}${url.search}`;
}

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const statusValue = String(formData.get("status") ?? "").trim();
  const returnTo = safeOrdersListReturnPath(formData.get("returnTo"));
  if (!orderId || orderId.length > 64 || !Object.values(OrderStatus).includes(statusValue as OrderStatus)) {
    redirect("/admin/orders?notice=invalid");
  }

  let notice = "updated";
  let errorMessage: string | undefined;
  try {
    const admin = await requireAdmin();
    const result = await changeOrderStatus(orderId, statusValue as OrderStatus, admin.id);
    if (!result.ok) {
      notice = result.reason === "not-found" ? "notFound"
        : result.reason === "missing-sku" ? "missingSku"
          : result.reason === "already-cancelled" ? "alreadyCancelled"
            : "transition";
    }
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/ar/login");
    if (error instanceof AuthorizationDeniedError) redirect("/admin/orders?notice=denied");
    if (error instanceof StorefrontOperationError && error.reason === "missing-sku") notice = "missingSku";
    else if (error instanceof StorefrontOperationError && error.reason === "restock-unavailable") notice = "restockUnavailable";
    else if (error instanceof StorefrontOperationError && error.reason === "stock-unavailable") notice = "reserveUnavailable";
    else {
      const diagnosis = diagnoseDatabaseError(error);
      console.error("Admin order status update failed.", {
        code: diagnosis.code,
        category: diagnosis.category,
        summary: diagnosis.summary,
        detail: diagnosis.detail,
        technicalMessage: diagnosis.technicalMessage,
      });
      notice = "error";
      errorMessage = diagnosis.formattedMessage;
    }
  }
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${encodeURIComponent(orderId)}`);
  revalidatePath("/admin/inventory");
  revalidatePath("/ar/orders");
  redirect(orderStatusDestination(orderId, notice, returnTo, errorMessage));
}

export async function updatePaymentStatusAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const statusValue = String(formData.get("paymentStatus") ?? "").trim();
  if (!orderId || orderId.length > 64) {
    redirect("/admin/orders?notice=invalid");
  }
  if (!Object.values(PaymentStatus).includes(statusValue as PaymentStatus)) {
    redirect(`/admin/orders/${encodeURIComponent(orderId)}?notice=paymentInvalid`);
  }

  let notice = "paymentUpdated";
  try {
    const admin = await requireAdmin();
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, select: { orderNumber: true, paymentStatus: true } });
      if (!order) return { ok: false as const, reason: "not-found" as const };
      if (order.paymentStatus === statusValue) return { ok: true as const, changed: false };

      const updated = await tx.order.updateMany({
        where: { id: orderId, paymentStatus: order.paymentStatus },
        data: { paymentStatus: statusValue as PaymentStatus },
      });
      if (updated.count !== 1) return { ok: false as const, reason: "conflict" as const };

      await tx.adminAuditLog.create({
        data: {
          actorUserId: admin.id,
          action: "orders.payment-status.update",
          entityType: "Order",
          entityId: orderId,
          metadata: { orderNumber: order.orderNumber, from: order.paymentStatus, to: statusValue },
        },
      });
      return { ok: true as const, changed: true };
    });
    if (!result.ok) notice = result.reason === "not-found" ? "notFound" : "paymentUpdateFailed";
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/ar/login");
    if (error instanceof AuthorizationDeniedError) redirect("/admin/orders?notice=denied");
    const diagnosis = diagnoseDatabaseError(error);
    console.error("Admin order payment status update failed.", {
      code: diagnosis.code,
      category: diagnosis.category,
      summary: diagnosis.summary,
      detail: diagnosis.detail,
      technicalMessage: diagnosis.technicalMessage,
    });
    notice = "paymentUpdateFailed";
    redirect(`/admin/orders/${encodeURIComponent(orderId)}?notice=${notice}&errorMsg=${encodeURIComponent(diagnosis.formattedMessage)}`);
  }

  if (notice === "paymentUpdated") {
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${encodeURIComponent(orderId)}`);
    revalidatePath("/ar/orders");
    revalidatePath("/ar/orders/[orderNumber]", "page");
  }
  redirect(`/admin/orders/${encodeURIComponent(orderId)}?notice=${notice}`);
}

export async function updateExchangeRequestStatusAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "").trim();
  const statusValue = String(formData.get("status") ?? "").trim();
  const allowedStatus = statusValue === ExchangeRequestStatus.APPROVED || statusValue === ExchangeRequestStatus.REJECTED || statusValue === ExchangeRequestStatus.COMPLETED;
  if (!requestId || requestId.length > 64 || !allowedStatus) {
    redirect("/admin/orders?notice=invalid");
  }

  const admin = await requireAdmin();
  const nextStatus = statusValue as ExchangeRequestStatus;
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.exchangeRequest.findUnique({
      where: { id: requestId },
      select: { id: true, orderId: true, orderItemId: true, status: true },
    });
    if (!request) return { ok: false as const, reason: "not-found" as const };
    const validTransition = request.status === ExchangeRequestStatus.PENDING && (nextStatus === ExchangeRequestStatus.APPROVED || nextStatus === ExchangeRequestStatus.REJECTED)
      || request.status === ExchangeRequestStatus.APPROVED && nextStatus === ExchangeRequestStatus.COMPLETED;
    if (!validTransition) return { ok: false as const, reason: "transition" as const };
    const updated = await tx.exchangeRequest.updateMany({
      where: { id: request.id, status: request.status },
      data: { status: nextStatus, reviewedAt: new Date() },
    });
    if (updated.count !== 1) return { ok: false as const, reason: "transition" as const };
    await tx.adminAuditLog.create({
      data: {
        actorUserId: admin.id,
        action: "orders.exchange-request.update",
        entityType: "ExchangeRequest",
        entityId: request.id,
        metadata: { orderId: request.orderId, orderItemId: request.orderItemId, from: request.status, to: nextStatus },
      },
    });
    return { ok: true as const, orderId: request.orderId };
  });
  if (!result.ok) redirect(`/admin/orders?notice=${result.reason === "not-found" ? "exchangeNotFound" : "exchangeTransition"}`);
  revalidatePath(`/admin/orders/${encodeURIComponent(result.orderId)}`);
  revalidatePath("/admin/orders");
  revalidatePath("/ar/orders");
  redirect(`/admin/orders/${encodeURIComponent(result.orderId)}?notice=exchangeUpdated`);
}

export async function deleteOrderAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId || orderId.length > 64) redirect("/admin/orders?notice=invalid");

  let notice = "deleted";
  try {
    const admin = await requireAdmin();
    const result = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT "id" FROM "orders" WHERE "id" = ${orderId} FOR UPDATE
      `);
      if (!locked.length) return "not-found" as const;

      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          items: { select: { skuId: true, quantity: true } },
        },
      });
      if (!order) return "not-found" as const;

      // Keep the dispatcher from claiming a pending message while deletion is in progress.
      await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT "id" FROM "notification_outbox" WHERE "orderId" = ${order.id} FOR UPDATE
      `);
      const processingNotification = await tx.notificationOutbox.findFirst({
        where: { orderId: order.id, status: NotificationStatus.PROCESSING },
        select: { id: true },
      });
      if (processingNotification) return "notification-processing" as const;

      const shouldRestock = order.status !== OrderStatus.CANCELLED &&
        order.status !== OrderStatus.SHIPPED &&
        order.status !== OrderStatus.DELIVERED;
      if (shouldRestock) {
        if (order.items.some((item) => item.skuId === null || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
          return "missing-sku" as const;
        }
        for (const item of order.items) {
          if (!item.skuId) throw new OrderDeletionError("deleteMissingSku");
          const restored = await tx.productSku.updateMany({
            where: { id: item.skuId, stockQuantity: { lte: 2_147_483_647 - item.quantity } },
            data: { stockQuantity: { increment: item.quantity } },
          });
          if (restored.count !== 1) throw new OrderDeletionError("deleteRestockUnavailable");
        }
      }

      await tx.notificationOutbox.deleteMany({ where: { orderId: order.id, status: NotificationStatus.PENDING } });
      await tx.notificationOutbox.updateMany({ where: { orderId: order.id }, data: { orderId: null } });
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.adminAuditLog.create({
        data: {
          actorUserId: admin.id,
          action: "orders.delete",
          entityType: "Order",
          entityId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            total: order.total.toString(),
            inventoryRestored: shouldRestock,
            ...(shouldRestock ? { restockedItems: order.items.map(({ skuId, quantity }) => ({ skuId, quantity })) } : {}),
          },
        },
      });
      await tx.order.delete({ where: { id: order.id } });
      return "deleted" as const;
    });

    if (result === "not-found") notice = "notFound";
    else if (result === "missing-sku") notice = "deleteMissingSku";
    else if (result === "notification-processing") notice = "deleteNotificationProcessing";
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) redirect("/ar/login");
    if (error instanceof AuthorizationDeniedError) redirect("/admin/orders?notice=denied");
    if (error instanceof OrderDeletionError) {
      notice = error.notice;
    } else {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "unknown";
      console.error("Admin order deletion failed.", { code });
      notice = "deleteFailed";
    }
  }

  if (notice === "deleted") {
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");
    revalidatePath("/ar/orders");
    revalidatePath("/ar/orders/[orderNumber]", "page");
  }
  if (notice === "deleted") redirect("/admin/orders?notice=deleted");
  redirect(`/admin/orders/${encodeURIComponent(orderId)}?notice=${notice}`);
}
