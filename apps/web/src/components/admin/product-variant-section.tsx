"use client";

import { useState } from "react";
import { adminMessages as messages } from "@/lib/admin/messages";

export type ColorOption = { name: string; hex: string; imageUrl?: string };
export type VariantQuantityMap = Record<string, number>; // key: `${colorName}|||${sizeLabel}`

type ProductVariantSectionProps = {
  hasVariants: boolean;
  initialColors: ColorOption[];
  initialSizes: string[];
  initialQuantities: VariantQuantityMap;
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
  onChange,
}: ProductVariantSectionProps) {
  const [hasVariants, setHasVariants] = useState(initialHasVariants);
  const [colors, setColors] = useState<ColorOption[]>(initialColors);
  const [sizes, setSizes] = useState<string[]>(initialSizes);
  const [quantities, setQuantities] = useState<VariantQuantityMap>(initialQuantities);

  // New color inputs
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

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

  const handleToggleHasVariants = (checked: boolean) => {
    setHasVariants(checked);
    updateParent(checked, colors, sizes, quantities);
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

    // Initialize quantities for new color with all existing sizes (default 0)
    const nextQuantities = { ...quantities };
    for (const size of sizes) {
      const key = `${trimmed}|||${size}`;
      if (!(key in nextQuantities)) {
        nextQuantities[key] = 0;
      }
    }
    setQuantities(nextQuantities);
    updateParent(hasVariants, nextColors, sizes, nextQuantities);
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
    updateParent(hasVariants, nextColors, sizes, quantities);
  };

  const handleAddSize = () => {
    const trimmed = newSizeLabel.trim();
    if (!trimmed) return;
    if (sizes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;

    const nextSizes = [...sizes, trimmed];
    setSizes(nextSizes);
    setNewSizeLabel("");

    // Initialize quantities for new size with all existing colors (default 0)
    const nextQuantities = { ...quantities };
    for (const color of colors) {
      const key = `${color.name}|||${trimmed}`;
      if (!(key in nextQuantities)) {
        nextQuantities[key] = 0;
      }
    }
    setQuantities(nextQuantities);
    updateParent(hasVariants, colors, nextSizes, nextQuantities);
  };

  const handleRemoveSize = (sizeLabel: string) => {
    const nextSizes = sizes.filter((s) => s.toLowerCase() !== sizeLabel.toLowerCase());
    setSizes(nextSizes);
    updateParent(hasVariants, colors, nextSizes, quantities);
  };

  const handleQuantityChange = (colorName: string, sizeLabel: string, value: string) => {
    const parsed = Math.max(0, Number.parseInt(value || "0", 10) || 0);
    const key = `${colorName}|||${sizeLabel}`;
    const nextQuantities = { ...quantities, [key]: parsed };
    setQuantities(nextQuantities);
    updateParent(hasVariants, colors, sizes, nextQuantities);
  };

  // Build variants array for hidden form field submission
  const variantsList = [];
  let totalStock = 0;

  if (colors.length > 0 && sizes.length > 0) {
    for (const color of colors) {
      for (const size of sizes) {
        const key = `${color.name}|||${size}`;
        const qty = quantities[key] ?? 0;
        totalStock += qty;
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
      totalStock += qty;
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
      totalStock += qty;
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
              <input
                type="text"
                placeholder={messages.ar.colorNamePlaceholder}
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddColor();
                  }
                }}
                className="ui-input py-1 px-3 text-sm rounded border border-border bg-surface"
              />
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
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-black/20" />
                    ) : (
                      <span
                        className="w-4 h-4 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                    )}
                    <span className="font-medium">{c.name}</span>
                    <label className="cursor-pointer text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md ml-2 hover:bg-blue-100 transition-colors" title="إضافة/تغيير الصورة">
                      🖼️ إضافة صورة
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadColorImage(c.name, e)} />
                    </label>
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
                <span className="text-xs font-medium bg-secondary text-primary px-2.5 py-1 rounded-md border border-border">
                  {messages.ar.totalCalculatedStock}: <strong>{totalStock}</strong>
                </span>
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
