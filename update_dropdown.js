const fs = require('fs');

// 1. Update ProductVariantSection to dispatch custom event
let path = 'apps/web/src/components/admin/product-variant-section.tsx';
let content = fs.readFileSync(path, 'utf8');

const updateParentOld = `  const updateParent = (
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
  };`;

const updateParentNew = `  const updateParent = (
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
  };`;

content = content.replace(updateParentOld, updateParentNew);
fs.writeFileSync(path, content, 'utf8');

// 2. Update ProductManagement to listen to event and improve styling
path = 'apps/web/src/components/admin/product-management.tsx';
content = fs.readFileSync(path, 'utf8');

// First add useEffect to the imports
content = content.replace(
  'import { useActionState, useState } from "react";',
  'import { useActionState, useState, useEffect } from "react";'
);

// Update ProductManagement component
const pmOld = `export function ProductManagement({ productId, images = [], colors, imageColors }: { productId: string; images?: ProductImage[]; colors?: { name: string; hex: string }[]; imageColors?: Record<string, string> }) {
  return <div className="mt-8 grid gap-6">`;

const pmNew = `export function ProductManagement({ productId, images = [], colors = [], imageColors }: { productId: string; images?: ProductImage[]; colors?: { name: string; hex: string }[]; imageColors?: Record<string, string> }) {
  const [liveColors, setLiveColors] = useState(colors);
  
  useEffect(() => {
    const handler = (e: any) => setLiveColors(e.detail);
    window.addEventListener('colorsChanged', handler);
    return () => window.removeEventListener('colorsChanged', handler);
  }, []);

  return <div className="mt-8 grid gap-6">`;

content = content.replace(pmOld, pmNew);

// Update the render of ImageControls to pass liveColors instead of colors
const controlsOld = `colors={colors}`;
const controlsNew = `colors={liveColors}`;
content = content.replace(controlsOld, controlsNew);

// Update ImageControls to improve the styling of the form and dropdown
const formOld = `    {colors && colors.length > 0 && (
      <form action={assignAction} className="flex items-center gap-2 mb-2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <span className="text-sm font-medium">لون الصورة:</span>
        <select name="colorName" defaultValue={assignedColor || ""} onChange={(e) => e.target.form.requestSubmit()} className="text-sm p-1 border rounded bg-white dark:bg-slate-800" disabled={assignPending}>
          <option value="">بدون لون مخصص</option>
          {colors.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        {assignPending && <span className="text-xs text-slate-500">جاري الحفظ...</span>}
      </form>
    )}`;

const formNew = `    {colors && colors.length > 0 && (
      <form action={assignAction} className="flex items-center justify-between gap-2 mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border border-blue-100 dark:border-slate-700 rounded-xl shadow-sm transition-all hover:shadow-md">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="imageUrl" value={imageUrl} />
        
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            <span className="text-sm">🎨</span>
          </div>
          
          <div className="flex-1">
            <select 
              name="colorName" 
              defaultValue={assignedColor || ""} 
              onChange={(e) => e.target.form.requestSubmit()} 
              className="w-full text-sm font-medium p-2 border-0 bg-transparent focus:ring-0 cursor-pointer text-slate-700 dark:text-slate-200 outline-none" 
              disabled={assignPending}
            >
              <option value="" className="text-slate-400">-- اختر لوناً للصورة --</option>
              {colors.map(c => <option key={c.name} value={c.name} className="font-semibold">{c.name}</option>)}
            </select>
          </div>
        </div>
        
        {assignPending && (
          <div className="flex items-center justify-center">
            <span className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></span>
          </div>
        )}
      </form>
    )}`;

content = content.replace(formOld, formNew);

fs.writeFileSync(path, content, 'utf8');
console.log("Files updated successfully.");
