"use server";

import { revalidatePath } from "next/cache";
import { ExchangeRequestStatus } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { checkExchangeEligibility, parseExchangeRequestInput } from "@/lib/storefront/exchange-policy.mjs";

export type ExchangeRequestState = { error?: string; success?: string };

export async function createExchangeRequestAction(_previous: ExchangeRequestState, formData: FormData): Promise<ExchangeRequestState> {
  const user = await getCurrentUser();
  if (!user) return { error: "سجّل الدخول من حسابك لطلب التبديل." };
  const parsed = parseExchangeRequestInput(formData, 9999);
  if (!parsed.ok) return { error: "تأكد من الكمية والسبب، وأكد وجود الفاتورة وقبول رسوم التوصيل." };

  try {
    const orderItem = await prisma.orderItem.findFirst({
      where: { id: parsed.value.orderItemId, order: { userId: user.id } },
      select: {
        id: true,
        quantity: true,
        isSaleSnapshot: true,
        order: { select: { id: true, orderNumber: true, status: true, deliveredAt: true } },
      },
    });
    if (!orderItem || parsed.value.quantity > orderItem.quantity) return { error: "تعذر العثور على بند الطلب أو أن الكمية المطلوبة غير صحيحة." };
    const eligibility = checkExchangeEligibility({ orderStatus: orderItem.order.status, deliveredAt: orderItem.order.deliveredAt, isSaleItem: orderItem.isSaleSnapshot });
    if (!eligibility.eligible) {
      return { error: eligibility.reason === "sale-item" ? "قطع العرض غير مشمولة بسياسة التبديل." : eligibility.reason === "outside-window" ? "انتهت مهلة التبديل البالغة 12 ساعة من التسليم." : "يمكن طلب التبديل بعد تسليم الطلب فقط." };
    }

    const result = await prisma.$transaction(async (tx) => {
      const lockedItem = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "order_items" WHERE "id" = ${orderItem.id} FOR UPDATE
      `;
      if (!lockedItem.length) return { ok: false as const, message: "تعذر العثور على بند الطلب." };
      const existingRequest = await tx.exchangeRequest.findFirst({
        where: { orderItemId: orderItem.id, status: { in: [ExchangeRequestStatus.PENDING, ExchangeRequestStatus.APPROVED, ExchangeRequestStatus.COMPLETED] } },
        select: { id: true },
      });
      if (existingRequest) return { ok: false as const, message: "يوجد طلب تبديل مسجل لهذا المنتج مسبقًا." };
      await tx.exchangeRequest.create({
        data: {
          orderId: orderItem.order.id,
          orderItemId: orderItem.id,
          userId: user.id,
          requestedQuantity: parsed.value.quantity,
          reason: parsed.value.reason,
          invoiceConfirmed: true,
          deliveryFeeAccepted: true,
        },
      });
      return { ok: true as const };
    });
    if (!result.ok) return { error: result.message };
    revalidatePath(`/ar/orders/${encodeURIComponent(orderItem.order.orderNumber)}`);
    revalidatePath("/admin/orders");
    return { success: "تم إرسال طلب التبديل، وسيتم مراجعته من إدارة المتجر." };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "unknown";
    console.error("Exchange request creation failed.", { code });
    return { error: "تعذر إرسال طلب التبديل. حاول مرة أخرى." };
  }
}