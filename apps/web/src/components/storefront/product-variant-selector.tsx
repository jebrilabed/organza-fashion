"use client";

import { useState } from "react";
import { Input } from "@/components/ui";
import { storefrontMessages as messages } from "@/lib/storefront/messages";
import { StorefrontSubmitButton } from "./submit-button";

export type VariantSkuData = {
  id: string;
  price: string;
  priceLabel: string;
  previousPriceLabel: string | null;
  stockQuantity: number;
  colorName?: string;
  colorHex?: string;
  colorImageUrl?: string;
  sizeLabel?: string;
};

type ProductVariantSelectorProps = {
  skus: VariantSkuData[];
  currency: string;
  totalStock: number;
  addToCartAction: (formData: FormData) => void;
};

export function ProductVariantSelector({
  skus,
  addToCartAction,
}: ProductVariantSelectorProps) {
  // Check if SKUs contain colors or sizes
  const colorsMap = new Map<string, { hex: string, imageUrl?: string }>();
  const sizesSet = new Set<string>();

  for (const sku of skus) {
    if (sku.colorName) {
      if (!colorsMap.has(sku.colorName)) {
        colorsMap.set(sku.colorName, { hex: sku.colorHex || "#000000", imageUrl: sku.colorImageUrl });
      } else if (sku.colorImageUrl && !colorsMap.get(sku.colorName)?.imageUrl) {
        // Update if we find an image later
        colorsMap.set(sku.colorName, { hex: sku.colorHex || "#000000", imageUrl: sku.colorImageUrl });
      }
    }
    if (sku.sizeLabel) {
      sizesSet.add(sku.sizeLabel);
    }
  }

  const colors = Array.from(colorsMap.entries()).map(([name, data]) => ({ name, hex: data.hex, imageUrl: data.imageUrl }));
  const sizes = Array.from(sizesSet);

  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;

  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Determine selectable color options (must have at least one size/variant with stock > 0)
  const isColorAvailable = (colorName: string) => {
    return skus.some((s) => (s.colorName ?? "") === colorName && s.stockQuantity > 0);
  };

  // Determine selectable size options for current selected color
  const isSizeAvailable = (sizeLabel: string) => {
    if (hasColors && !selectedColor) return false;
    return skus.some((s) => {
      const matchColor = hasColors ? (s.colorName ?? "") === selectedColor : true;
      const matchSize = (s.sizeLabel ?? "") === sizeLabel;
      return matchColor && matchSize && s.stockQuantity > 0;
    });
  };

  // Find exact matching SKU
  const matchedSku = skus.find((s) => {
    const matchColor = hasColors ? (s.colorName ?? "") === selectedColor : true;
    const matchSize = hasSizes ? (s.sizeLabel ?? "") === selectedSize : true;
    return matchColor && matchSize;
  });

  const isSelectionComplete = (!hasColors || !!selectedColor) && (!hasSizes || !!selectedSize);
  const selectedStock = matchedSku ? matchedSku.stockQuantity : 0;
  const isAddToCartDisabled = !isSelectionComplete || selectedStock <= 0;

  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    setValidationError(null);
    const colorData = colors.find((c) => c.name === colorName);
    if (colorData?.imageUrl) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("updateProductImage", { detail: colorData.imageUrl }));
      }
    }
    // Revalidate size: if currently selected size is out of stock in new color, reset size
    if (selectedSize) {
      const isAvailableInNewColor = skus.some(
        (s) => (s.colorName ?? "") === colorName && (s.sizeLabel ?? "") === selectedSize && s.stockQuantity > 0
      );
      if (!isAvailableInNewColor) {
        setSelectedSize("");
      }
    }
  };

  const handleSizeChange = (sizeLabel: string) => {
    setSelectedSize(sizeLabel);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (hasColors && !selectedColor) {
      e.preventDefault();
      setValidationError(messages.ar.selectColor);
      return;
    }
    if (hasSizes && !selectedSize) {
      e.preventDefault();
      setValidationError(messages.ar.selectSize);
      return;
    }
    const parsedQuantity = Number(quantity);
    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity < 1) {
      e.preventDefault();
      setValidationError(messages.ar.validationQuantity);
      return;
    }
    if (!matchedSku || matchedSku.stockQuantity < parsedQuantity) {
      e.preventDefault();
      setValidationError(messages.ar.outOfStock);
      return;
    }
  };

  // Fallback for simple products with 1 SKU
  if (!hasColors && !hasSizes && skus.length === 1) {
    const simpleSku = skus[0];
    return (
      <form action={addToCartAction} className="store-form space-y-4">
        <input type="hidden" name="skuId" value={simpleSku.id} />
        <Input
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          label={messages.ar.quantity}
          max={simpleSku.stockQuantity}
          min={1}
          name="quantity"
          required
          type="number"
        />
        <StorefrontSubmitButton pendingText={messages.ar.adding} disabled={simpleSku.stockQuantity <= 0}>
          {messages.ar.addToCart}
        </StorefrontSubmitButton>
      </form>
    );
  }

  return (
    <form action={addToCartAction} onSubmit={handleSubmit} className="store-form space-y-5 my-4">
      <input type="hidden" name="skuId" value={matchedSku ? matchedSku.id : ""} />

      {isSelectionComplete && matchedSku && (
        <p className="store-variant-price">
          <span>{messages.ar.price}</span>
          <strong>{matchedSku.priceLabel}</strong>
          {matchedSku.previousPriceLabel && <del aria-label={messages.ar.priceBeforeDiscount}>{matchedSku.previousPriceLabel}</del>}
        </p>
      )}

      {/* Color Swatches */}
      {hasColors && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {messages.ar.color}: {selectedColor && <span className="font-bold text-slate-900 dark:text-white">{selectedColor}</span>}
          </label>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => {
              const available = isColorAvailable(c.name);
              const selected = selectedColor === c.name;
              const isHexOnly = c.name.startsWith('#');
              
              if (isHexOnly) {
                return (
                  <button
                    type="button"
                    key={c.name}
                    onClick={() => available && handleColorChange(c.name)}
                    disabled={!available}
                    title={!available ? messages.ar.outOfStock : ''}
                    className={`group relative flex items-center justify-center rounded-full transition-all shrink-0 w-8 h-8 ${selected
                        ? "ring-2 ring-[var(--color-primary)] ring-offset-2 shadow-md border-transparent"
                        : available
                          ? "border border-black/20 shadow-sm hover:scale-110"
                          : "border border-slate-200 opacity-40 cursor-not-allowed"
                      }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {!available && <div className="absolute w-[120%] h-0.5 bg-red-500/80 -rotate-45" />}
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  key={c.name}
                  onClick={() => available && handleColorChange(c.name)}
                  disabled={!available}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all ${selected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-secondary)] font-semibold shadow-md ring-2 ring-[var(--color-primary)]/20"
                      : available
                        ? "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]/30 transition-colors"
                        : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
                    }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-sm"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                  {!available && <span className="text-[10px] text-red-500 font-normal">({messages.ar.outOfStock})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Buttons */}
      {hasSizes && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {messages.ar.size}: {selectedSize && <span className="font-bold text-slate-900 dark:text-white">{selectedSize}</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const available = isSizeAvailable(s);
              const selected = selectedSize === s;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => available && handleSizeChange(s)}
                  disabled={!available}
                  className={`min-w-[44px] h-10 px-3 flex items-center justify-center rounded-md border text-sm font-medium transition-all ${selected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-secondary)] font-bold shadow-md ring-2 ring-[var(--color-primary)]/20"
                      : available
                        ? "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]/30 transition-colors"
                        : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed line-through opacity-50 dark:border-slate-850 dark:bg-slate-900/40 dark:text-slate-600"
                    }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation Message */}
      {validationError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-sm font-medium">
          {validationError}
        </div>
      )}

      {/* Stock status indicator */}
      {isSelectionComplete && matchedSku && matchedSku.stockQuantity <= 0 && (
        <div className="text-sm">
          <span className="text-red-600 dark:text-red-400 font-medium">
            ✕ {messages.ar.outOfStock}
          </span>
        </div>
      )}

      {/* Quantity & Add to Cart */}
      <div className="space-y-3 pt-2">
        <Input
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          label={messages.ar.quantity}
          max={matchedSku ? Math.max(1, matchedSku.stockQuantity) : 1}
          min={1}
          name="quantity"
          required
          type="number"
          disabled={isAddToCartDisabled}
        />
        <StorefrontSubmitButton pendingText={messages.ar.adding} disabled={isAddToCartDisabled}>
          {messages.ar.addToCart}
        </StorefrontSubmitButton>
      </div>
    </form>
  );
}
