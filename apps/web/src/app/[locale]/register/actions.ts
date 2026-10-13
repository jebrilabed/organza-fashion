"use server";

import { redirect } from "next/navigation";
import { hashPassword } from "@/lib/auth/password-hash.mjs";
import { prisma } from "@/lib/db/prisma";
import { parseRegistration } from "@/lib/phase7/validation.mjs";
import { phase7Messages as messages } from "@/lib/phase7/messages";

export type RegistrationState = { error?: string; fieldErrors?: Record<string, string> };
export async function registerCustomer(_previous: RegistrationState, formData: FormData): Promise<RegistrationState> {
  const parsed = parseRegistration(formData);
  if (!parsed.ok) return { fieldErrors: parsed.errors };
  try {
    const passwordHash = await hashPassword(parsed.value.password);
    await prisma.user.create({
      data: {
        name: parsed.value.name, phone: parsed.value.phone, passwordHash, role: "CUSTOMER",
        customer: { create: { name: parsed.value.name, phone: parsed.value.phone } },
        addresses: { create: { fullName: parsed.value.name, phone: parsed.value.phone, addressLine: parsed.value.addressLine, city: parsed.value.city, isDefault: true } },
      },
      select: { id: true },
    });
  } catch (error) {
    const code = error && typeof error === "object"
      ? "code" in error ? String(error.code) : "errorCode" in error ? String(error.errorCode) : "unknown"
      : "unknown";
    console.error("Customer registration failed.", { code });
    if (code === "P2002") return { fieldErrors: { phone: "phoneAlreadyRegistered" } };
    if (["P1000", "P1001", "P1002", "P1017", "P2024", "P2028"].includes(code)) {
      return { error: messages.ar.registrationUnavailable };
    }
    return { error: messages.ar.registrationFailed };
  }
  redirect(formData.get("next") === "/ar/checkout" ? "/ar/login?registered=1&next=%2Far%2Fcheckout" : "/ar/login?registered=1");
}
