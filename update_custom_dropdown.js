const fs = require('fs');
const path = 'apps/web/src/components/admin/product-management.tsx';
let content = fs.readFileSync(path, 'utf8');

// Import useRef
content = content.replace(
  'import { useActionState, useState, useEffect } from "react";',
  'import { useActionState, useState, useEffect, useRef } from "react";'
);

const controlsOld = `function ImageControls({ productId, imageId, imageUrl, index, count, colors, assignedColor }: { productId: string; imageId: string; imageUrl: string; index: number; count: number; colors?: { name: string; hex: string }[]; assignedColor?: string }) {
  const [moveState, moveAction, movePending] = useActionState(moveImage, {} as ManagementState);
  const [primaryState, primaryAction, primaryPending] = useActionState(makePrimaryImage, {} as ManagementState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteImage, {} as ManagementState);
  const [assignState, assignAction, assignPending] = useActionState(assignImageColor, {} as ManagementState);

  const hidden = <><input type="hidden" name="productId" value={productId} /><input type="hidden" name="imageId" value={imageId} /></>;
  return <div className="grid gap-2">
    {colors && colors.length > 0 && (
      <form action={assignAction} className="flex items-center justify-between gap-2 mb-3 p-3 bg-[var(--color-secondary)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-sm transition-all hover:shadow-md">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="imageUrl" value={imageUrl} />
        
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm border border-[var(--color-border)] text-[var(--color-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
          </div>
          
          <div className="flex-1">
            <select 
              name="colorName" 
              defaultValue={assignedColor || ""} 
              onChange={(e) => e.target.form.requestSubmit()} 
              className="w-full text-sm font-medium p-1 border-0 bg-transparent focus:ring-0 cursor-pointer text-[var(--color-text)] outline-none" 
              disabled={assignPending}
            >
              <option value="" className="text-[var(--color-muted)]">-- اختر لوناً للصورة --</option>
              {colors.map(c => <option key={c.name} value={c.name} className="font-semibold text-[var(--color-primary)]">{c.name}</option>)}
            </select>
          </div>
        </div>
        
        {assignPending && (
          <div className="flex items-center justify-center">
            <span className="animate-spin w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></span>
          </div>
        )}
      </form>
    )}`;

const controlsNew = `function ImageControls({ productId, imageId, imageUrl, index, count, colors, assignedColor }: { productId: string; imageId: string; imageUrl: string; index: number; count: number; colors?: { name: string; hex: string }[]; assignedColor?: string }) {
  const [moveState, moveAction, movePending] = useActionState(moveImage, {} as ManagementState);
  const [primaryState, primaryAction, primaryPending] = useActionState(makePrimaryImage, {} as ManagementState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteImage, {} as ManagementState);
  const [assignState, assignAction, assignPending] = useActionState(assignImageColor, {} as ManagementState);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const hidden = <><input type="hidden" name="productId" value={productId} /><input type="hidden" name="imageId" value={imageId} /></>;
  
  const selectedColor = colors?.find(c => c.name === assignedColor);

  return <div className="grid gap-2">
    {colors && colors.length > 0 && (
      <form ref={formRef} action={assignAction} className="flex items-center justify-between gap-2 mb-3 p-2 bg-[var(--color-secondary)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-sm transition-all hover:shadow-md relative">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <input type="hidden" name="colorName" value={assignedColor || ""} />
        
        <div className="flex items-center gap-2 w-full cursor-pointer" onClick={() => !assignPending && setDropdownOpen(!dropdownOpen)}>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm border border-[var(--color-border)] text-[var(--color-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
          </div>
          
          <div className="flex-1 px-1">
            {selectedColor ? (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border border-[var(--color-border)] shadow-sm block" style={{ backgroundColor: selectedColor.hex }}></span>
                <span className="text-sm font-semibold text-[var(--color-primary)]">
                  {selectedColor.name.startsWith('#') ? '' : selectedColor.name}
                </span>
              </div>
            ) : (
              <span className="text-sm text-[var(--color-muted)]">-- اختر لوناً للصورة --</span>
            )}
          </div>
        </div>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-lg z-50 p-1 max-h-48 overflow-y-auto">
            <div 
              onClick={() => {
                const input = formRef.current?.querySelector('input[name="colorName"]') as HTMLInputElement;
                if (input) input.value = "";
                setDropdownOpen(false);
                formRef.current?.requestSubmit();
              }}
              className="p-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-secondary)] cursor-pointer rounded-[var(--radius-control)] mb-1"
            >
              بدون لون مخصص
            </div>
            {colors.map(c => (
              <div 
                key={c.name}
                onClick={() => {
                  const input = formRef.current?.querySelector('input[name="colorName"]') as HTMLInputElement;
                  if (input) input.value = c.name;
                  setDropdownOpen(false);
                  formRef.current?.requestSubmit();
                }}
                className="flex items-center gap-3 p-2 hover:bg-[var(--color-secondary)] cursor-pointer rounded-[var(--radius-control)] transition-colors"
              >
                <span className="w-6 h-6 rounded-full border border-[var(--color-border)] shadow-sm block" style={{ backgroundColor: c.hex }}></span>
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  {c.name.startsWith('#') ? 'هذا اللون' : c.name}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {assignPending && (
          <div className="flex items-center justify-center pl-2">
            <span className="animate-spin w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></span>
          </div>
        )}
      </form>
    )}`;

content = content.replace(controlsOld, controlsNew);
fs.writeFileSync(path, content, 'utf8');
console.log("Custom dropdown with color swatches added successfully.");
