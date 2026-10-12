"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { ToastMessage } from "@/components/ui/toast";
import { registerCustomer } from "./actions";
import { phase7Messages as messages } from "@/lib/phase7/messages";

export function RegisterForm({ nextPath = "" }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(registerCustomer, {});
  const labels: Record<string, string> = { invalidName: messages.ar.invalidName, invalidEmail: messages.ar.invalidEmail, emailAlreadyRegistered: messages.ar.emailAlreadyRegistered, invalidPassword: messages.ar.invalidPassword, passwordMismatch: messages.ar.passwordMismatch, invalidPhone: "أدخل رقم جوال محلياً صالحاً.", invalidAddress: "أدخل عنواناً صالحاً.", invalidCity: "أدخل المدينة." };
  const fieldError = (key: string) => { const code = state.fieldErrors?.[key]; return code ? labels[code] ?? "تحقق من القيمة المدخلة." : undefined; };
  return <form action={action} className="flex flex-col gap-4">
    {nextPath && <input name="next" type="hidden" value={nextPath} />}
    <Input autoComplete="name" label={messages.ar.registerName} name="name" required maxLength={120} error={fieldError("name")} />
    <Input autoComplete="email" dir="ltr" label={messages.ar.registerEmail} type="email" name="email" required maxLength={254} error={fieldError("email")} />
    <Input autoComplete="tel-national" dir="ltr" hint="أدخل رقم الجوال المحلي دون رمز الدولة." label="رقم الجوال" name="phone" required inputMode="tel" maxLength={20} error={fieldError("phone")} />
    <Input autoComplete="street-address" label="العنوان" name="addressLine" required maxLength={500} error={fieldError("addressLine")} />
    <Input autoComplete="address-level2" label="المدينة" name="city" required maxLength={120} error={fieldError("city")} />
    <Input autoComplete="new-password" label={messages.ar.registerPassword} type="password" name="password" required minLength={8} maxLength={128} error={fieldError("password")} />
    <Input autoComplete="new-password" label={messages.ar.registerConfirm} type="password" name="confirmation" required minLength={8} maxLength={128} error={fieldError("confirmation")} />
    <ToastMessage eventKey={state} message={state.error} tone="error" />
    <Button loading={pending} type="submit">{messages.ar.createAccount}</Button>
    <p className="text-sm">{messages.ar.hasAccount} <Link href={nextPath ? "/ar/login?next=%2Far%2Fcheckout" : "/ar/login"} className="underline">{messages.ar.login}</Link></p>
  </form>;
}
