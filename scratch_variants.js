const fs = require('fs');

// 1. Update product-variant-section.tsx
let path = 'apps/web/src/components/admin/product-variant-section.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'export type ColorOption = { name: string; hex: string };',
  'export type ColorOption = { name: string; hex: string; imageUrl?: string };'
);

const uploadCode = `  const uploadColorImage = async (colorName: string, event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRemoveColor`;

content = content.replace('  const handleRemoveColor', uploadCode);

content = content.replace(
  `        variantsList.push({
          colorName: color.name,
          colorHex: color.hex,
          sizeLabel: size,
          stockQuantity: qty,
        });`,
  `        variantsList.push({
          colorName: color.name,
          colorHex: color.hex,
          colorImageUrl: color.imageUrl,
          sizeLabel: size,
          stockQuantity: qty,
        });`
);

content = content.replace(
  `      variantsList.push({
        colorName: color.name,
        colorHex: color.hex,
        sizeLabel: "",
        stockQuantity: qty,
      });`,
  `      variantsList.push({
        colorName: color.name,
        colorHex: color.hex,
        colorImageUrl: color.imageUrl,
        sizeLabel: "",
        stockQuantity: qty,
      });`
);

const colorRenderOld = `                    <span
                      className="w-4 h-4 rounded-full border border-black/20"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="font-medium">{c.name}</span>
                    <button`;

const colorRenderNew = `                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-black/20" />
                    ) : (
                      <span
                        className="w-4 h-4 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                    )}
                    <span className="font-medium">{c.name}</span>
                    <label className="cursor-pointer text-[10px] text-blue-600 underline ml-1" title="إضافة/تغيير الصورة">
                      صورة
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadColorImage(c.name, e)} />
                    </label>
                    <button`;

content = content.replace(colorRenderOld, colorRenderNew);

fs.writeFileSync(path, content, 'utf8');

// 2. Update actions.ts to save colorImageUrl
path = 'apps/web/src/app/(admin)/admin/actions.ts';
content = fs.readFileSync(path, 'utf8');

const variantOptionsBuildOld = `            const variantOptions: Record<string, string> = {};
            if (v.colorName) {
              variantOptions["Color"] = v.colorName;
              if (v.colorHex) variantOptions["ColorHex"] = v.colorHex;
            }`;

const variantOptionsBuildNew = `            const variantOptions: Record<string, string> = {};
            if (v.colorName) {
              variantOptions["Color"] = v.colorName;
              if (v.colorHex) variantOptions["ColorHex"] = v.colorHex;
              if (v.colorImageUrl) variantOptions["ColorImageUrl"] = v.colorImageUrl;
            }`;

// There are two occurrences of this in actions.ts (one for creation, one for update)
content = content.replaceAll(variantOptionsBuildOld, variantOptionsBuildNew);

fs.writeFileSync(path, content, 'utf8');

// 3. Update product-variant-selector.tsx to pick up colorImageUrl and change DOM image
path = 'apps/web/src/components/storefront/product-variant-selector.tsx';
content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '  colorHex?: string;',
  '  colorHex?: string;\n  colorImageUrl?: string;'
);

content = content.replace(
  'const colorsMap = new Map<string, string>();',
  'const colorsMap = new Map<string, { hex: string, imageUrl?: string }>();'
);

content = content.replace(
  `    if (sku.colorName) {
      colorsMap.set(sku.colorName, sku.colorHex || "#000000");
    }`,
  `    if (sku.colorName) {
      if (!colorsMap.has(sku.colorName)) {
        colorsMap.set(sku.colorName, { hex: sku.colorHex || "#000000", imageUrl: sku.colorImageUrl });
      } else if (sku.colorImageUrl && !colorsMap.get(sku.colorName)?.imageUrl) {
        // Update if we find an image later
        colorsMap.set(sku.colorName, { hex: sku.colorHex || "#000000", imageUrl: sku.colorImageUrl });
      }
    }`
);

content = content.replace(
  '  const colors = Array.from(colorsMap.entries()).map(([name, hex]) => ({ name, hex }));',
  '  const colors = Array.from(colorsMap.entries()).map(([name, data]) => ({ name, hex: data.hex, imageUrl: data.imageUrl }));'
);

const handleColorChangeOld = `  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    setValidationError(null);`;

const handleColorChangeNew = `  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    setValidationError(null);
    const colorData = colors.find((c) => c.name === colorName);
    if (colorData?.imageUrl) {
      const img = document.querySelector('.store-product-detail__image img') as HTMLImageElement;
      if (img) {
        img.srcset = '';
        img.src = colorData.imageUrl;
      }
    }`;

content = content.replace(handleColorChangeOld, handleColorChangeNew);

const colorButtonRenderOld = `                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />`;

const colorButtonRenderNew = `                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-black/20 shrink-0" />
                  ) : (
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                  )}`;

content = content.replace(colorButtonRenderOld, colorButtonRenderNew);

fs.writeFileSync(path, content, 'utf8');

// 4. Update product-details (page.tsx) to pass colorImageUrl to ProductVariantSelector
path = 'apps/web/src/app/[locale]/(store)/products/[slug]/page.tsx';
content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `                    colorHex: opts["ColorHex"],`,
  `                    colorHex: opts["ColorHex"],
                    colorImageUrl: opts["ColorImageUrl"],`
);

fs.writeFileSync(path, content, 'utf8');

console.log("All done");
