"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input, Select } from "@/components/ui";
import { ToastMessage } from "@/components/ui/toast";
import { registerCustomer } from "./actions";
import { phase7Messages as messages } from "@/lib/phase7/messages";

export function RegisterForm({ nextPath = "" }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(registerCustomer, {});
  const labels: Record<string, string> = { invalidName: messages.ar.invalidName, invalidEmail: messages.ar.invalidEmail, emailAlreadyRegistered: messages.ar.emailAlreadyRegistered, invalidPassword: messages.ar.invalidPassword, passwordMismatch: messages.ar.passwordMismatch, invalidPhone: "أدخل رقم واتساب صحيحاً مع رمز الدولة.", invalidAddress: "أدخل عنواناً صالحاً.", invalidCity: "أدخل المدينة." };
  const fieldError = (key: string) => { const code = state.fieldErrors?.[key]; return code ? labels[code] ?? "تحقق من القيمة المدخلة." : undefined; };
  return <form action={action} className="flex flex-col gap-4">
    {nextPath && <input name="next" type="hidden" value={nextPath} />}
    <Input autoComplete="name" label={messages.ar.registerName} name="name" required maxLength={120} error={fieldError("name")} />
    <Input autoComplete="email" dir="ltr" label={messages.ar.registerEmail} type="email" name="email" required maxLength={254} error={fieldError("email")} />
    <Select label="رمز الدولة" name="countryCode" defaultValue="+966" required>
      <option value="+966">السعودية (+966)</option><option value="+970">فلسطين (+970)</option><option value="+962">الأردن (+962)</option><option value="+971">الإمارات (+971)</option><option value="+965">الكويت (+965)</option><option value="+973">البحرين (+973)</option><option value="+974">قطر (+974)</option><option value="+968">عُمان (+968)</option><option value="+20">مصر (+20)</option><option value="+964">العراق (+964)</option><option value="+967">اليمن (+967)</option><option value="+1">دول أخرى (+1)</option><option value="+44">دول أخرى (+44)</option>
    </Select>
    <Input autoComplete="tel-national" dir="ltr" label="رقم الواتساب" name="phone" required inputMode="tel" maxLength={20} error={fieldError("phone")} />
    <Input autoComplete="street-address" label="العنوان" name="addressLine" required maxLength={500} error={fieldError("addressLine")} />
    <Input autoComplete="address-level2" label="المدينة" name="city" required maxLength={120} error={fieldError("city")} />
    <Input autoComplete="new-password" label={messages.ar.registerPassword} type="password" name="password" required minLength={8} maxLength={128} error={fieldError("password")} />
    <Input autoComplete="new-password" label={messages.ar.registerConfirm} type="password" name="confirmation" required minLength={8} maxLength={128} error={fieldError("confirmation")} />
    <ToastMessage eventKey={state} message={state.error} tone="error" />
    <Button loading={pending} type="submit">{messages.ar.createAccount}</Button>
    <p className="text-sm">{messages.ar.hasAccount} <Link href={nextPath ? "/ar/login?next=%2Far%2Fcheckout" : "/ar/login"} className="underline">{messages.ar.login}</Link></p>
  </form>;
}
