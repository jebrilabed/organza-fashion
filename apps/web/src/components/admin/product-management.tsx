"use client";
import { useActionState, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cloudinaryImageUrl } from "@/lib/seo/cloudinary-image.mjs";
import { Button, Card } from "@/components/ui";
import { ToastMessage } from "@/components/ui/toast";
import { deleteImage, makePrimaryImage, moveImage, saveImage, assignImageColor, type ManagementState } from "@/app/(admin)/admin/products/[id]/management-actions";
import { adminMessages } from "@/lib/admin/messages";
import { phase7Messages as messages } from "@/lib/phase7/messages";
import { ProductImageUploader, type UploadedProductImage } from "./product-image-uploader";

function productImageLoader({ src, width }: { src: string; width: number }) {
  return cloudinaryImageUrl(src, width) ?? src;
}
type ProductImage = { id: string; url: string; providerPublicId: string | null; altText: string | null; sortOrder: number };
function ImageEditor({ productId, image, canAddImage }: { productId: string; image?: ProductImage; canAddImage: boolean }) {
  const [state, action, pending] = useActionState(saveImage, {} as ManagementState);
  const [uploadedImage, setUploadedImage] = useState<UploadedProductImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const currentUrl = uploadedImage?.url ?? image?.url ?? "";
  const currentPublicId = uploadedImage?.providerPublicId ?? image?.providerPublicId ?? "";
  return <form action={action} className="admin-image-editor">
    <input name="productId" type="hidden" value={productId} />
    <input name="imageId" type="hidden" value={image?.id ?? ""} />
    <input name="url" type="hidden" value={currentUrl} />
    <input name="providerPublicId" type="hidden" value={currentPublicId} />
    <ProductImageUploader maxFiles={image ? 1 : canAddImage ? 1 : 0} onUploaded={setUploadedImage} onUploadingChange={setUploading} />
    {uploadedImage && <div className="admin-product-image-preview"><Image alt={uploadedImage.fileName} height={72} loader={productImageLoader} src={uploadedImage.url} width={72} /><span>{uploadedImage.fileName}</span></div>}
    <div className="flex flex-wrap items-center gap-2">
      <ToastMessage eventKey={state} message={state.error} tone="error" />
      <ToastMessage eventKey={state} message={state.success} tone="success" />
      <Button type="submit" disabled={uploading || !currentUrl} loading={pending}>{image ? messages.ar.saveImage : messages.ar.addImage}</Button>
    </div>
  </form>;
}
function ImageControls({ productId, imageId, imageUrl, index, count, colors, assignedColor }: { productId: string; imageId: string; imageUrl: string; index: number; count: number; colors?: { name: string; hex: string }[]; assignedColor?: string }) {
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
    )}
    <div className="flex flex-wrap gap-2">
      {index > 0 && <form action={moveAction}>{hidden}<input type="hidden" name="direction" value="up" /><Button type="submit" size="small" variant="outline" loading={movePending}>{messages.ar.moveUp}</Button></form>}
      {index < count - 1 && <form action={moveAction}>{hidden}<input type="hidden" name="direction" value="down" /><Button type="submit" size="small" variant="outline" loading={movePending}>{messages.ar.moveDown}</Button></form>}
      <form action={primaryAction}>{hidden}<Button type="submit" size="small" variant="outline" loading={primaryPending}>{messages.ar.setPrimary}</Button></form>
      <form action={deleteAction}>{hidden}<Button type="submit" size="small" variant="ghost" loading={deletePending}>{messages.ar.delete}</Button></form>
    </div>
    <ToastMessage eventKey={moveState} message={moveState.error} tone="error" /><ToastMessage eventKey={moveState} message={moveState.success} tone="success" /><ToastMessage eventKey={primaryState} message={primaryState.error} tone="error" /><ToastMessage eventKey={primaryState} message={primaryState.success} tone="success" /><ToastMessage eventKey={deleteState} message={deleteState.error} tone="error" /><ToastMessage eventKey={deleteState} message={deleteState.success} tone="success" /><ToastMessage eventKey={assignState} message={assignState.error} tone="error" /><ToastMessage eventKey={assignState} message={assignState.success} tone="success" />
  </div>;
}
export function ProductManagement({ productId, images = [], colors = [], imageColors }: { productId: string; images?: ProductImage[]; colors?: { name: string; hex: string }[]; imageColors?: Record<string, string> }) {
  const [liveColors, setLiveColors] = useState(colors);
  
  useEffect(() => {
    const handler = (e: any) => setLiveColors(e.detail);
    window.addEventListener('colorsChanged', handler);
    return () => window.removeEventListener('colorsChanged', handler);
  }, []);

  return <div className="mt-8 grid gap-6">
    <Card><h2 className="mb-4 text-xl font-semibold">{messages.ar.productImages}</h2>{images.length ? <div className="mb-4 grid gap-4 md:grid-cols-2">{images.map((image, index) => <div key={image.id} className="grid gap-2 rounded-xl border p-3"><div className="flex items-center gap-3"><Image loader={productImageLoader} src={image.url} alt={image.altText || adminMessages.ar.imageAlt} width={96} height={96} className="rounded object-cover" /><span>{image.sortOrder === 0 ? messages.ar.primaryImage : messages.ar.imageNumber.replace("{number}", String(image.sortOrder + 1))}</span></div><ImageEditor productId={productId} image={image} canAddImage={false} /><ImageControls productId={productId} imageId={image.id} imageUrl={image.url} index={index} count={images.length} colors={liveColors} assignedColor={imageColors?.[image.url]} /></div>)}</div> : <p className="mb-4">{messages.ar.noImages}</p>}<ImageEditor productId={productId} canAddImage={images.length < 8} /></Card>
  </div>;
}
