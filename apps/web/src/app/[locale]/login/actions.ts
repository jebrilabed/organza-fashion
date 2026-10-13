"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import type { LoginState } from "@/lib/auth/types";
import { prisma } from "@/lib/db/prisma";
import { normalizeAccountPhone } from "@/lib/auth/phone.mjs";

const invalidCredentialsMessage = "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.";

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const phone = normalizeAccountPhone(formData.get("phone"));
  const password = formData.get("password");
  const returnToCheckout = formData.get("next") === "/ar/checkout";

  if (
    !phone ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    return { error: invalidCredentialsMessage };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { role: true },
    });
    await signIn("credentials", {
      phone,
      password,
      redirectTo: user?.role === "ADMIN" ? "/admin" : returnToCheckout ? "/ar/checkout" : "/ar",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: invalidCredentialsMessage };
    throw error;
  }

  return { error: invalidCredentialsMessage };
}
