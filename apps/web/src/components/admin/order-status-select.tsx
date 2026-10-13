"use client";

import { useId, useRef, useTransition } from "react";

interface InlineStatusSelectProps {
  /** Server action URL — pass as bound action via bind() or use formAction */
  orderId: string;
  returnTo?: string;
  fieldName: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  /** The server action function — passed as a prop (Next.js App Router supports this) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (formData: FormData) => Promise<any>;
  pendingLabel?: string;
}

/**
 * Compact inline status selector.
 * Auto-submits when the user picks a new value — no submit button needed.
 */
export function InlineStatusSelect({
  action,
  orderId,
  returnTo,
  fieldName,
  defaultValue,
  options,
  pendingLabel = "جارٍ الحفظ…",
}: InlineStatusSelectProps) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.set(fieldName, e.currentTarget.value);
    startTransition(() => action(formData));
  }

  return (
    <form
      ref={formRef}
      className="order-inline-status-form"
      onSubmit={(e) => e.preventDefault()}
    >
      <input name="orderId" type="hidden" value={orderId} />
      {returnTo && <input name="returnTo" type="hidden" value={returnTo} />}
      <select
        id={id}
        name={fieldName}
        defaultValue={defaultValue}
        disabled={isPending}
        className={`order-inline-status-select${isPending ? " order-inline-status-select--pending" : ""}`}
        onChange={handleChange}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {isPending && opt.value === defaultValue ? pendingLabel : opt.label}
          </option>
        ))}
      </select>
    </form>
  );
}
