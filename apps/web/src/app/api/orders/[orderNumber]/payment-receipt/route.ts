import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ orderNumber: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const { orderNumber } = await context.params;
  const order = await prisma.order.findFirst({
    where: { orderNumber, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
    select: { paymentReceipt: { select: { mimeType: true, data: true } } },
  });
  if (!order?.paymentReceipt || !["image/jpeg", "image/png", "image/webp"].includes(order.paymentReceipt.mimeType)) {
    return NextResponse.json({ error: "not-found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return new NextResponse(Buffer.from(order.paymentReceipt.data), {
    headers: {
      "Content-Type": order.paymentReceipt.mimeType,
      "Content-Disposition": "inline; filename=payment-receipt",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
