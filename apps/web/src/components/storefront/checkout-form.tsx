"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Input, Textarea } from "@/components/ui";
import { ToastMessage } from "@/components/ui/toast";
import { storefrontMessages as messages } from "@/lib/storefront/messages";
import { submitCheckoutAction, type CheckoutActionState } from "@/app/[locale]/(store)/actions";
import type { BankTransferDetails } from "@/lib/storefront/payment-settings";

const initialState: CheckoutActionState = {};

export function CheckoutForm({ checkoutToken, quoteFingerprint, checkoutExpiresAt, contactName, contactPhone, address, city, bankTransfer, deliveryZones }: {
  checkoutToken: string;
  quoteFingerprint: string;
  checkoutExpiresAt: number;
  contactName: string;
  contactPhone: string;
  address: string;
  city: string;
  bankTransfer: BankTransferDetails | null;
  deliveryZones: { name: string; price: string; priceLabel: string; discountLabel: string | null; totalLabel: string }[];
}) {
  const [activeCheckoutToken, setActiveCheckoutToken] = useState(checkoutToken);
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
  const [deliveryZoneName, setDeliveryZoneName] = useState(deliveryZones[0]?.name ?? "");
  const [state, action, pending] = useActionState(submitCheckoutAction, initialState);
  const selectedDeliveryZone = deliveryZones.find((zone) => zone.name === deliveryZoneName);
  useEffect(() => {
    const storageKey = "shimo:checkout-attempt";
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const attempt = JSON.parse(stored) as { fingerprint?: unknown; token?: unknown; expiresAt?: unknown };
        if (attempt.fingerprint === quoteFingerprint && typeof attempt.token === "string" &&
          typeof attempt.expiresAt === "number" && attempt.expiresAt > Date.now()) {
          setActiveCheckoutToken(attempt.token);
          return;
        }
      }
      sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint: quoteFingerprint, token: checkoutToken, expiresAt: checkoutExpiresAt }));
    } catch {
      // The signed token in the form remains the server-issued fallback.
    }
  }, [checkoutExpiresAt, checkoutToken, quoteFingerprint]);
  const values = state.values;
  const fieldError = (key: string) => state.fieldErrors?.[key]
    ? messages.ar[state.fieldErrors[key] as keyof typeof messages.ar]
    : undefined;

  return (
    <form action={action} className="store-form">
      <input name="checkoutToken" type="hidden" value={activeCheckoutToken} />
      <Input autoComplete="name" defaultValue={values?.contactName ?? contactName} label={messages.ar.contactName} maxLength={200} name="contactName" required error={fieldError("contactName")} />
      <Input autoComplete="tel-national" dir="ltr" defaultValue={values?.contactPhone ?? contactPhone} hint={messages.ar.localMobileNumberHint} inputMode="tel" label={messages.ar.phone} maxLength={20} name="contactPhone" required error={fieldError("contactPhone")} />
      <label className="ui-field">
        <span className="ui-field__label">{messages.ar.deliveryZone}</span>
        <select className="ui-field__control" name="deliveryZoneName" required value={deliveryZoneName} onChange={(event) => setDeliveryZoneName(event.target.value)}>
          {deliveryZones.map((zone) => <option key={zone.name} value={zone.name}>{zone.name} ({zone.priceLabel})</option>)}
        </select>
      </label>
      {fieldError("deliveryZoneName") && <p className="ui-field__error">{fieldError("deliveryZoneName")}</p>}
      {selectedDeliveryZone && <div>
        <p className="store-summary__row"><span>{messages.ar.shippingCost}</span><strong>{selectedDeliveryZone.priceLabel}</strong></p>
        {selectedDeliveryZone.discountLabel && <p className="store-summary__row"><span>{messages.ar.fifthOrderDiscount}</span><strong>-{selectedDeliveryZone.discountLabel}</strong></p>}
        <p className="store-summary__row"><span>{messages.ar.total}</span><strong>{selectedDeliveryZone.totalLabel}</strong></p>
      </div>}
      <Input autoComplete="street-address" defaultValue={values?.address ?? address} label={messages.ar.detailedAddress} maxLength={500} name="address" required error={fieldError("address")} />
      <Input autoComplete="address-level2" defaultValue={values?.city ?? city} label={messages.ar.city} maxLength={120} name="city" required error={fieldError("city")} />
      <Textarea defaultValue={values?.customerNote} label={messages.ar.note} maxLength={2000} name="customerNote" rows={4} error={fieldError("customerNote")} />
      <label className="ui-field">
        <span className="ui-field__label">{messages.ar.paymentMethod}</span>
        <select className="ui-field__control" name="paymentMethod" required value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
          <option value="CASH_ON_DELIVERY">{messages.ar.cashOnDelivery}</option>
          {bankTransfer && <option value="BANK_TRANSFER">{messages.ar.bankTransfer}</option>}
        </select>
      </label>
      {fieldError("paymentMethod") && <p className="ui-field__error">{fieldError("paymentMethod")}</p>}
      {paymentMethod === "BANK_TRANSFER" && bankTransfer && <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold">{messages.ar.transferDetails}</h3>
        <p>{messages.ar.bankName}: {bankTransfer.bankName}</p>
        <p>{messages.ar.accountName}: {bankTransfer.accountName}</p>
        {bankTransfer.accountNumber && <p>{messages.ar.accountNumber}: <span dir="ltr">{bankTransfer.accountNumber}</span></p>}
        {bankTransfer.iban && <p>{messages.ar.iban}: <span dir="ltr">{bankTransfer.iban}</span></p>}
        <p className="mt-2 text-sm">{messages.ar.transferReceiptHint}</p>
      </div>}
      {paymentMethod === "BANK_TRANSFER" && <Input accept="image/jpeg,image/png,image/webp" label={messages.ar.paymentReceipt} name="paymentReceipt" required type="file" error={fieldError("paymentReceipt")} />}
      <ToastMessage eventKey={state} message={state.error} tone="error" />
      {(state.error === messages.ar.checkoutCartChanged || state.error === messages.ar.stockChanged || state.error === messages.ar.cartInvalid) && <Link href="/ar/cart">{messages.ar.reviewCart}</Link>}
      <Button loading={pending} type="submit">{messages.ar.placeOrder}</Button>
    </form>
  );
}
