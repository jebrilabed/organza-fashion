const fs = require('fs');

// 1. Update management-actions.ts
let path = 'apps/web/src/app/(admin)/admin/products/[id]/management-actions.ts';
let content = fs.readFileSync(path, 'utf8');

const newAction = `
export async function assignImageColor(_previous: ManagementState, data: FormData): Promise<ManagementState> {
  let admin; try { admin = await requireAdmin(); } catch { return { error: messages.ar.imageUnauthorized }; }
  const productId = fieldText(data, "productId");
  const imageUrl = fieldText(data, "imageUrl");
  const colorName = fieldText(data, "colorName");

  if (!productId || !imageUrl) return { error: "معلومات مفقودة" };

  try {
    await prisma.$transaction(async (tx) => {
      const skus = await tx.productSku.findMany({ where: { productId } });
      for (const sku of skus) {
        if (!sku.variantOptions || typeof sku.variantOptions !== "object") continue;
        const opts = sku.variantOptions as Record<string, string>;
        
        let changed = false;
        
        // If they chose a color, assign it to that color (and remove from others if they had this image?)
        // Let's just remove this image from ANY color that has it currently
        if (opts["ColorImageUrl"] === imageUrl) {
          delete opts["ColorImageUrl"];
          changed = true;
        }

        // Now assign to the new color if provided
        if (colorName && opts["Color"] === colorName) {
          opts["ColorImageUrl"] = imageUrl;
          changed = true;
        }

        if (changed) {
          await tx.productSku.update({
            where: { id: sku.id },
            data: { variantOptions: opts }
          });
        }
      }
      
      await tx.adminAuditLog.create({ 
        data: { actorUserId: admin.id, action: "catalog.image.assign_color", entityType: "Product", entityId: productId, metadata: { imageUrl, colorName } } 
      });
    });
  } catch (error) {
    return { error: "حدث خطأ أثناء ربط الصورة باللون" };
  }
  revalidatePath(\`/admin/products/\${productId}\`); 
  revalidatePath("/ar"); 
  revalidatePath("/ar/products/[slug]", "page");
  return { success: "تم تحديث لون الصورة بنجاح" };
}
`;

content += newAction;
fs.writeFileSync(path, content, 'utf8');

// 2. Update EditProductPage (page.tsx)
path = 'apps/web/src/app/(admin)/admin/products/[id]/page.tsx';
content = fs.readFileSync(path, 'utf8');

const imageColorsCalc = `  const initialSizes = Array.from(sizesSet);

  const imageColors: Record<string, string> = {};
  if (hasVariants) {
    for (const s of product.skus) {
      if (!s.variantOptions || typeof s.variantOptions !== "object") continue;
      const opts = s.variantOptions as Record<string, string>;
      if (opts["Color"] && opts["ColorImageUrl"]) {
        imageColors[opts["ColorImageUrl"]] = opts["Color"];
      }
    }
  }`;

content = content.replace('  const initialSizes = Array.from(sizesSet);', imageColorsCalc);

const productManagementOld = `<ProductManagement
    productId={product.id}
    images={(product.images ?? []).map(({ id: imageId, url, providerPublicId, altText, sortOrder }) => ({
      id: imageId,
      url,
      providerPublicId,
      altText,
      sortOrder,
    }))}
  />`;

const productManagementNew = `<ProductManagement
    productId={product.id}
    colors={initialColors}
    imageColors={imageColors}
    images={(product.images ?? []).map(({ id: imageId, url, providerPublicId, altText, sortOrder }) => ({
      id: imageId,
      url,
      providerPublicId,
      altText,
      sortOrder,
    }))}
  />`;

content = content.replace(productManagementOld, productManagementNew);
fs.writeFileSync(path, content, 'utf8');

// 3. Update ProductManagement (product-management.tsx)
path = 'apps/web/src/components/admin/product-management.tsx';
content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'import { deleteImage, makePrimaryImage, moveImage, saveImage, type ManagementState } from "@/app/(admin)/admin/products/[id]/management-actions";',
  'import { deleteImage, makePrimaryImage, moveImage, saveImage, assignImageColor, type ManagementState } from "@/app/(admin)/admin/products/[id]/management-actions";'
);

const imageControlsOld = `function ImageControls({ productId, imageId, index, count }: { productId: string; imageId: string; index: number; count: number }) {
  const [moveState, moveAction, movePending] = useActionState(moveImage, {} as ManagementState);
  const [primaryState, primaryAction, primaryPending] = useActionState(makePrimaryImage, {} as ManagementState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteImage, {} as ManagementState);
  const hidden = <><input type="hidden" name="productId" value={productId} /><input type="hidden" name="imageId" value={imageId} /></>;
  return <div className="grid gap-2"><div className="flex flex-wrap gap-2">
    {index > 0 && <form action={moveAction}>{hidden}<input type="hidden" name="direction" value="up" /><Button type="submit" size="small" variant="outline" loading={movePending}>{messages.ar.moveUp}</Button></form>}
    {index < count - 1 && <form action={moveAction}>{hidden}<input type="hidden" name="direction" value="down" /><Button type="submit" size="small" variant="outline" loading={movePending}>{messages.ar.moveDown}</Button></form>}
    <form action={primaryAction}>{hidden}<Button type="submit" size="small" variant="outline" loading={primaryPending}>{messages.ar.setPrimary}</Button></form>
    <form action={deleteAction}>{hidden}<Button type="submit" size="small" variant="ghost" loading={deletePending}>{messages.ar.delete}</Button></form>
  </div><ToastMessage eventKey={moveState} message={moveState.error} tone="error" /><ToastMessage eventKey={moveState} message={moveState.success} tone="success" /><ToastMessage eventKey={primaryState} message={primaryState.error} tone="error" /><ToastMessage eventKey={primaryState} message={primaryState.success} tone="success" /><ToastMessage eventKey={deleteState} message={deleteState.error} tone="error" /><ToastMessage eventKey={deleteState} message={deleteState.success} tone="success" /></div>;
}`;

const imageControlsNew = `function ImageControls({ productId, imageId, imageUrl, index, count, colors, assignedColor }: { productId: string; imageId: string; imageUrl: string; index: number; count: number; colors?: { name: string; hex: string }[]; assignedColor?: string }) {
  const [moveState, moveAction, movePending] = useActionState(moveImage, {} as ManagementState);
  const [primaryState, primaryAction, primaryPending] = useActionState(makePrimaryImage, {} as ManagementState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteImage, {} as ManagementState);
  const [assignState, assignAction, assignPending] = useActionState(assignImageColor, {} as ManagementState);

  const hidden = <><input type="hidden" name="productId" value={productId} /><input type="hidden" name="imageId" value={imageId} /></>;
  return <div className="grid gap-2">
    {colors && colors.length > 0 && (
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
    )}
    <div className="flex flex-wrap gap-2">
      {index > 0 && <form action={moveAction}>{hidden}<input type="hidden" name="direction" value="up" /><Button type="submit" size="small" variant="outline" loading={movePending}>{messages.ar.moveUp}</Button></form>}
      {index < count - 1 && <form action={moveAction}>{hidden}<input type="hidden" name="direction" value="down" /><Button type="submit" size="small" variant="outline" loading={movePending}>{messages.ar.moveDown}</Button></form>}
      <form action={primaryAction}>{hidden}<Button type="submit" size="small" variant="outline" loading={primaryPending}>{messages.ar.setPrimary}</Button></form>
      <form action={deleteAction}>{hidden}<Button type="submit" size="small" variant="ghost" loading={deletePending}>{messages.ar.delete}</Button></form>
    </div>
    <ToastMessage eventKey={moveState} message={moveState.error} tone="error" /><ToastMessage eventKey={moveState} message={moveState.success} tone="success" /><ToastMessage eventKey={primaryState} message={primaryState.error} tone="error" /><ToastMessage eventKey={primaryState} message={primaryState.success} tone="success" /><ToastMessage eventKey={deleteState} message={deleteState.error} tone="error" /><ToastMessage eventKey={deleteState} message={deleteState.success} tone="success" /><ToastMessage eventKey={assignState} message={assignState.error} tone="error" /><ToastMessage eventKey={assignState} message={assignState.success} tone="success" />
  </div>;
}`;

content = content.replace(imageControlsOld, imageControlsNew);

const productManagementDefOld = `export function ProductManagement({ productId, images = [] }: { productId: string; images?: ProductImage[] }) {`;
const productManagementDefNew = `export function ProductManagement({ productId, images = [], colors, imageColors }: { productId: string; images?: ProductImage[]; colors?: { name: string; hex: string }[]; imageColors?: Record<string, string> }) {`;

content = content.replace(productManagementDefOld, productManagementDefNew);

const imageControlsRenderOld = `<ImageControls productId={productId} imageId={image.id} index={index} count={images.length} />`;
const imageControlsRenderNew = `<ImageControls productId={productId} imageId={image.id} imageUrl={image.url} index={index} count={images.length} colors={colors} assignedColor={imageColors?.[image.url]} />`;

content = content.replace(imageControlsRenderOld, imageControlsRenderNew);

fs.writeFileSync(path, content, 'utf8');
console.log("Done");
