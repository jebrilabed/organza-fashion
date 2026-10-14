"use client";

import { useEffect, useId, useRef, useState } from "react";
import { adminMessages as messages } from "@/lib/admin/messages";

export type ColorOption = { name: string; hex: string; imageUrl?: string };
export type VariantQuantityMap = Record<string, number>; // key: `${colorName}|||${sizeLabel}`

const COLOR_SUGGESTIONS = [
  { name: "أسود", hex: "#000000" },
  { name: "أبيض", hex: "#FFFFFF" },
  { name: "أحمر", hex: "#E53935" },
  { name: "أزرق", hex: "#1E88E5" },
  { name: "أخضر", hex: "#43A047" },
  { name: "أصفر", hex: "#FDD835" },
  { name: "برتقالي", hex: "#FB8C00" },
  { name: "وردي", hex: "#EC407A" },
  { name: "بنفسجي", hex: "#8E24AA" },
  { name: "بني", hex: "#795548" },
  { name: "رمادي", hex: "#757575" },
  { name: "ذهبي", hex: "#D4AF37" },
  { name: "فضي", hex: "#C0C0C0" },
  { name: "بيج", hex: "#D7C3A5" },
  { name: "كحلي", hex: "#1A237E" },
  { name: "فيروزي", hex: "#26A69A" },
  { name: "خمري", hex: "#800020" },
];

const COLOR_NAME_ALIASES: Record<string, string> = {
  زهري: "#EC407A",
  روز: "#EC407A",
  موف: "#8E24AA",
  ليلكي: "#8E24AA",
  سماوي: "#87CEEB",
  لبني: "#87CEEB",
  زيتي: "#556B2F",
  نبيتي: "#800020",
};

function normalizeColorName(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي");
}

function colorNameToHex(value: string) {
  const trimmed = value.trim();
  const normalized = normalizeColorName(trimmed);
  const suggestion = COLOR_SUGGESTIONS.find((color) => normalizeColorName(color.name) === normalized);
  if (suggestion) return suggestion.hex;
  if (COLOR_NAME_ALIASES[normalized]) return COLOR_NAME_ALIASES[normalized];

  const hexMatch = trimmed.match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  if (hexMatch) {
    const digits = hexMatch[1].length === 3
      ? hexMatch[1].split("").map((digit) => `${digit}${digit}`).join("")
      : hexMatch[1];
    return `#${digits.toUpperCase()}`;
  }

  // Also accept standard CSS color names such as "navy" or "coral".
  if (typeof CSS !== "undefined" && CSS.supports("color", trimmed) && normalized !== "transparent" && normalized !== "currentcolor") {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context) {
      context.fillStyle = trimmed;
      context.fillRect(0, 0, 1, 1);
      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
      return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    }
  }

  return undefined;
}

function distributeStock(stockQuantity: number, colors: ColorOption[], sizes: string[]): VariantQuantityMap {
  const keys = colors.length > 0 && sizes.length > 0
    ? colors.flatMap((color) => sizes.map((size) => `${color.name}|||${size}`))
    : colors.length > 0
      ? colors.map((color) => `${color.name}|||`)
      : sizes.map((size) => `|||${size}`);
  if (keys.length === 0) return {};

  const stock = Math.max(0, Math.floor(stockQuantity || 0));
  const baseQuantity = Math.floor(stock / keys.length);
  const remainder = stock % keys.length;
  return Object.fromEntries(keys.map((key, index) => [key, baseQuantity + (index < remainder ? 1 : 0)]));
}

type ProductVariantSectionProps = {
  hasVariants: boolean;
  initialColors: ColorOption[];
  initialSizes: string[];
  initialQuantities: VariantQuantityMap;
  totalStock: number;
  onChange: (data: {
    hasVariants: boolean;
    colors: ColorOption[];
    sizes: string[];
    quantities: VariantQuantityMap;
  }) => void;
};

export function ProductVariantSection({
  hasVariants: initialHasVariants,
  initialColors,
  initialSizes,
  initialQuantities,
  totalStock: totalStockProp,
  onChange,
}: ProductVariantSectionProps) {
  const colorSuggestionsId = useId();
  const [hasVariants, setHasVariants] = useState(initialHasVariants);
  const [colors, setColors] = useState<ColorOption[]>(initialColors);
  const [sizes, setSizes] = useState<string[]>(initialSizes);
  const [quantities, setQuantities] = useState<VariantQuantityMap>(initialQuantities);

  // Keep track of the user's intended total stock to distribute across cells
  const targetStockRef = useRef(totalStockProp);
  useEffect(() => {
    if (totalStockProp > 0) {
      targetStockRef.current = totalStockProp;
    }
  }, [totalStockProp]);

  const getStockToDistribute = () => {
    if (totalStockProp > 0) return totalStockProp;
    if (targetStockRef.current > 0) return targetStockRef.current;
    const currentSum = Object.values(quantities).reduce((a, b) => a + b, 0);
    return currentSum > 0 ? currentSum : 0;
  };

  // New color inputs
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [activeColorSuggestion, setActiveColorSuggestion] = useState(0);
  const colorSuggestions = [...COLOR_SUGGESTIONS, ...colors.filter((color) => !COLOR_SUGGESTIONS.some((suggestion) => suggestion.name.toLowerCase() === color.name.toLowerCase()))];
  const matchingColorSuggestions = newColorName.trim()
    ? colorSuggestions.filter((color) => {
      const normalizedName = normalizeColorName(color.name);
      const normalizedQuery = normalizeColorName(newColorName);
      return normalizedName !== normalizedQuery && normalizedName.includes(normalizedQuery);
    }).slice(0, 6)
    : [];

  // New size input
  const [newSizeLabel, setNewSizeLabel] = useState("");

  const updateParent = (
    nextHasVariants: boolean,
    nextColors: ColorOption[],
    nextSizes: string[],
    nextQuantities: VariantQuantityMap
  ) => {
    onChange({
      hasVariants: nextHasVariants,
      colors: nextColors,
      sizes: nextSizes,
      quantities: nextQuantities,
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('colorsChanged', { detail: nextColors }));
    }
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const rawQuantity = (event as CustomEvent<string>).detail;
      const stockQuantity = Number.parseInt(rawQuantity, 10) || 0;
      targetStockRef.current = stockQuantity;
      if (!hasVariants || (colors.length === 0 && sizes.length === 0)) return;
      const nextQuantities = distributeStock(stockQuantity, colors, sizes);
      setQuantities(nextQuantities);
      updateParent(hasVariants, colors, sizes, nextQuantities);
    };
    window.addEventListener("productStockQuantityCommitted", handler);
    return () => window.removeEventListener("productStockQuantityCommitted", handler);
  }, [colors, hasVariants, sizes]);

  const handleToggleHasVariants = (checked: boolean) => {
    setHasVariants(checked);
    if (checked && (colors.length > 0 || sizes.length > 0)) {
      const stockToUse = getStockToDistribute();
      const nextQuantities = distributeStock(stockToUse, colors, sizes);
      setQuantities(nextQuantities);
      updateParent(checked, colors, sizes, nextQuantities);
    } else {
      updateParent(checked, colors, sizes, quantities);
    }
  };

  const handleAddColor = () => {
    let trimmed = newColorName.trim();
    if (!trimmed) {
      trimmed = newColorHex; // Fallback to hex if no name is provided
    }
    
    if (colors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return;

    const nextColors = [...colors, { name: trimmed, hex: newColorHex }];
    setColors(nextColors);
    setNewColorName("");
    setNewColorHex("#000000");

    const stockToUse = getStockToDistribute();
    const nextQuantities = distributeStock(stockToUse, nextColors, sizes);
    setQuantities(nextQuantities);
    updateParent(hasVariants, nextColors, sizes, nextQuantities);
  };

  const selectColorSuggestion = (color: ColorOption) => {
    setNewColorName(color.name);
    setNewColorHex(color.hex);
  };

  const uploadColorImage = async (colorName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch("/api/admin/products/images/upload", { method: "POST", body: data });
      const result = await res.json();
      if (result.url) {
        const nextColors = colors.map(c => c.name === colorName ? { ...c, imageUrl: result.url } : c);
        setColors(nextColors);
        updateParent(hasVariants, nextColors, sizes, quantities);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveColor = (colorName: string) => {
    const nextColors = colors.filter((c) => c.name.toLowerCase() !== colorName.toLowerCase());
    setColors(nextColors);
    const stockToUse = getStockToDistribute();
    const nextQuantities = distributeStock(stockToUse, nextColors, sizes);
    setQuantities(nextQuantities);
    updateParent(hasVariants, nextColors, sizes, nextQuantities);
  };

  const handleAddSize = () => {
    const trimmed = newSizeLabel.trim();
    if (!trimmed) return;
    if (sizes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;

    const nextSizes = [...sizes, trimmed];
    setSizes(nextSizes);
    setNewSizeLabel("");

    const stockToUse = getStockToDistribute();
    const nextQuantities = distributeStock(stockToUse, colors, nextSizes);
    setQuantities(nextQuantities);
    updateParent(hasVariants, colors, nextSizes, nextQuantities);
  };

  const handleRemoveSize = (sizeLabel: string) => {
    const nextSizes = sizes.filter((s) => s.toLowerCase() !== sizeLabel.toLowerCase());
    setSizes(nextSizes);
    const stockToUse = getStockToDistribute();
    const nextQuantities = distributeStock(stockToUse, colors, nextSizes);
    setQuantities(nextQuantities);
    updateParent(hasVariants, colors, nextSizes, nextQuantities);
  };

  const handleQuantityChange = (colorName: string, sizeLabel: string, value: string) => {
    const parsed = Math.max(0, Number.parseInt(value || "0", 10) || 0);
    const key = `${colorName}|||${sizeLabel}`;
    const nextQuantities = { ...quantities, [key]: parsed };
    setQuantities(nextQuantities);
    const newSum = Object.values(nextQuantities).reduce((a, b) => a + b, 0);
    targetStockRef.current = newSum;
    updateParent(hasVariants, colors, sizes, nextQuantities);
  };

  // Build variants array for hidden form field submission
  const variantsList = [];
  let calculatedTotalStock = 0;

  if (colors.length > 0 && sizes.length > 0) {
    for (const color of colors) {
      for (const size of sizes) {
        const key = `${color.name}|||${size}`;
        const qty = quantities[key] ?? 0;
        calculatedTotalStock += qty;
        variantsList.push({
          colorName: color.name,
          colorHex: color.hex,
          colorImageUrl: color.imageUrl,
          sizeLabel: size,
          stockQuantity: qty,
        });
      }
    }
  } else if (colors.length > 0) {
    for (const color of colors) {
      const key = `${color.name}|||`;
      const qty = quantities[key] ?? 0;
      calculatedTotalStock += qty;
      variantsList.push({
        colorName: color.name,
        colorHex: color.hex,
        colorImageUrl: color.imageUrl,
        sizeLabel: "",
        stockQuantity: qty,
      });
    }
  } else if (sizes.length > 0) {
    for (const size of sizes) {
      const key = `|||${size}`;
      const qty = quantities[key] ?? 0;
      calculatedTotalStock += qty;
      variantsList.push({
        colorName: "",
        colorHex: "#000000",
        sizeLabel: size,
        stockQuantity: qty,
      });
    }
  }

  return (
    <div className="admin-form__wide admin-variant-section border border-border rounded-lg p-4 bg-canvas my-4 space-y-4">
      <input type="hidden" name="hasVariants" value={hasVariants ? "true" : "false"} />
      <input type="hidden" name="colorsJson" value={JSON.stringify(colors)} />
      <input type="hidden" name="sizesJson" value={JSON.stringify(sizes)} />
      <input type="hidden" name="variantsJson" value={JSON.stringify(variantsList)} />

      <label className="admin-checkbox font-semibold text-lg flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={hasVariants}
          onChange={(e) => handleToggleHasVariants(e.target.checked)}
        />
        <span>{messages.ar.enableVariants}</span>
      </label>

      {hasVariants && (
        <div className="space-y-6 pt-2">
          {/* Colors Management */}
          <div className="space-y-2">
            <h3 className="font-semibold text-md text-text">
              {messages.ar.manageColors}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  id={colorSuggestionsId}
                  type="text"
                  autoComplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                  aria-expanded={matchingColorSuggestions.length > 0}
                  aria-controls={matchingColorSuggestions.length > 0 ? `${colorSuggestionsId}-options` : undefined}
                  aria-activedescendant={matchingColorSuggestions.length > 0 ? `${colorSuggestionsId}-option-${activeColorSuggestion}` : undefined}
                  placeholder={messages.ar.colorNamePlaceholder}
                  value={newColorName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewColorName(value);
                    setActiveColorSuggestion(0);
                    const existingColor = colors.find((color) => normalizeColorName(color.name) === normalizeColorName(value));
                    const detectedHex = existingColor?.hex ?? colorNameToHex(value);
                    if (detectedHex) setNewColorHex(detectedHex);
                  }}
                  onKeyDown={(e) => {
                    if (matchingColorSuggestions.length > 0 && e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveColorSuggestion((current) => (current + 1) % matchingColorSuggestions.length);
                      return;
                    }
                    if (matchingColorSuggestions.length > 0 && e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveColorSuggestion((current) => (current - 1 + matchingColorSuggestions.length) % matchingColorSuggestions.length);
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (matchingColorSuggestions[activeColorSuggestion]) {
                        selectColorSuggestion(matchingColorSuggestions[activeColorSuggestion]);
                        return;
                      }
                      handleAddColor();
                    }
                  }}
                  className="ui-input py-1 px-3 text-sm rounded border border-border bg-surface"
                />
                {matchingColorSuggestions.length > 0 && (
                  <div id={`${colorSuggestionsId}-options`} role="listbox" className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded border border-border bg-surface p-1 shadow-lg">
                    {matchingColorSuggestions.map((color, index) => (
                      <div
                        id={`${colorSuggestionsId}-option-${index}`}
                        key={color.name}
                        role="option"
                        aria-selected={index === activeColorSuggestion}
                        tabIndex={-1}
                        onMouseMove={() => setActiveColorSuggestion(index)}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectColorSuggestion(color)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-right text-sm ${index === activeColorSuggestion ? "bg-secondary" : "hover:bg-secondary"}`}
                      >
                        <span aria-hidden="true" className="h-4 w-4 rounded-full border border-black/20" style={{ backgroundColor: color.hex }} />
                        <span>{color.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 border border-border rounded p-1 bg-surface">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                  title={messages.ar.colorSwatch}
                />
                <span className="text-xs uppercase font-mono px-1">{newColorHex}</span>
              </div>
              <button
                type="button"
                onClick={handleAddColor}
                className="ui-button ui-button--secondary text-xs py-1 px-3"
              >
                + {messages.ar.addColor}
              </button>
            </div>

            {colors.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {colors.map((c) => (
                  <div
                    key={c.name}
                    className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-1 rounded-full text-sm shadow-sm"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/20"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="font-medium">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(c.name)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold mr-1"
                      title={messages.ar.removeColor}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sizes Management */}
          <div className="space-y-2">
            <h3 className="font-semibold text-md text-text">
              {messages.ar.manageSizes}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder={messages.ar.sizePlaceholder}
                value={newSizeLabel}
                onChange={(e) => setNewSizeLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSize();
                  }
                }}
                className="ui-input py-1 px-3 text-sm rounded border border-border bg-surface"
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="ui-button ui-button--secondary text-xs py-1 px-3"
              >
                + {messages.ar.addSize}
              </button>
            </div>

            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {sizes.map((s) => (
                  <div
                    key={s}
                    className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-1 rounded-full text-sm shadow-sm"
                  >
                    <span className="font-medium">{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(s)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold mr-1"
                      title={messages.ar.removeSize}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inventory Matrix Table */}
          {(colors.length > 0 || sizes.length > 0) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-md text-text">
                  {messages.ar.inventoryMatrix}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const stockToUse = getStockToDistribute();
                      if (stockToUse > 0) {
                        const nextQuantities = distributeStock(stockToUse, colors, sizes);
                        setQuantities(nextQuantities);
                        updateParent(hasVariants, colors, sizes, nextQuantities);
                      }
                    }}
                    className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                    title="إعادة توزيع المخزون الكلي بالتساوي على جميع الخلايا"
                  >
                    ↻ إعادة التوزيع بالتساوي
                  </button>
                  <span className="text-xs font-medium bg-secondary text-primary px-2.5 py-1 rounded-md border border-border">
                    {messages.ar.totalCalculatedStock}: <strong>{calculatedTotalStock}</strong>
                  </span>
                </div>
              </div>

              {colors.length > 0 && sizes.length > 0 && (
                <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
                  <table className="w-full text-sm text-right border-collapse bg-surface">
                    <thead>
                      <tr className="bg-secondary text-text">
                        <th className="p-2 border border-border">
                          {messages.ar.manageColors} / {messages.ar.manageSizes}
                        </th>
                        {sizes.map((s) => (
                          <th key={s} className="p-2 text-center border border-border">
                            {s}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {colors.map((c) => (
                        <tr key={c.name} className="hover:bg-secondary">
                          <td className="p-2 border border-border font-medium">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span>{c.name}</span>
                            </div>
                          </td>
                          {sizes.map((s) => {
                            const key = `${c.name}|||${s}`;
                            const qty = quantities[key] ?? 0;
                            return (
                              <td key={s} className="p-2 border border-border text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={qty}
                                  onChange={(e) => handleQuantityChange(c.name, s, e.target.value)}
                                  className={`w-20 text-center py-1 px-2 border rounded text-sm ${
                                    qty === 0
                                      ? "border-red-300 bg-red-50 text-red-600 "
                                      : "border-border bg-surface"
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {colors.length > 0 && sizes.length === 0 && (
                <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
                  <table className="w-full text-sm text-right border-collapse bg-surface">
                    <thead>
                      <tr className="bg-secondary text-text">
                        <th className="p-2 border border-border">{messages.ar.manageColors}</th>
                        <th className="p-2 text-center border border-border">{messages.ar.stock}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colors.map((c) => {
                        const key = `${c.name}|||`;
                        const qty = quantities[key] ?? 0;
                        return (
                          <tr key={c.name}>
                            <td className="p-2 border border-border font-medium">
                              <div className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />
                                <span>{c.name}</span>
                              </div>
                            </td>
                            <td className="p-2 border border-border text-center">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={qty}
                                onChange={(e) => handleQuantityChange(c.name, "", e.target.value)}
                                className={`w-24 text-center py-1 px-2 border rounded text-sm ${
                                  qty === 0 ? "border-red-300 bg-red-50 text-red-600" : "border-border"
                                }`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {sizes.length > 0 && colors.length === 0 && (
                <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
                  <table className="w-full text-sm text-right border-collapse bg-surface">
                    <thead>
                      <tr className="bg-secondary text-text">
                        <th className="p-2 border border-border">{messages.ar.manageSizes}</th>
                        <th className="p-2 text-center border border-border">{messages.ar.stock}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map((s) => {
                        const key = `|||${s}`;
                        const qty = quantities[key] ?? 0;
                        return (
                          <tr key={s}>
                            <td className="p-2 border border-border font-medium">{s}</td>
                            <td className="p-2 border border-border text-center">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={qty}
                                onChange={(e) => handleQuantityChange("", s, e.target.value)}
                                className={`w-24 text-center py-1 px-2 border rounded text-sm ${
                                  qty === 0 ? "border-red-300 bg-red-50 text-red-600" : "border-border"
                                }`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
