const fs = require('fs');

// 1. Create VariantOptionsDisplay.tsx
const voPath = 'apps/web/src/components/storefront/variant-options-display.tsx';
const voContent = `import { Prisma } from "@/generated/prisma/client";
import { displayVariantOptions } from "@/lib/storefront/format";

export function VariantOptionsDisplay({ options }: { options: Prisma.JsonValue | null }) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
     const str = displayVariantOptions(options);
     return str ? <span>{str}</span> : null;
  }
  const opts = options as Record<string, any>;
  const color = opts["Color"];
  const colorHex = opts["ColorHex"];
  const size = opts["Size"];
  const colorIsHex = typeof color === 'string' && color.startsWith("#");

  if (!color && !size) {
    const str = displayVariantOptions(options);
    return str ? <span>{str}</span> : null;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      {color && (
        <span className="inline-flex items-center gap-1">
          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: colorHex || (colorIsHex ? color : '#000') }}></span>
          {!colorIsHex && <span>{color}</span>}
        </span>
      )}
      {color && size && <span className="opacity-50">/</span>}
      {size && <span>{size}</span>}
    </span>
  );
}
`;
fs.writeFileSync(voPath, voContent, 'utf8');

// 2. Update cart/page.tsx
const cartPath = 'apps/web/src/app/[locale]/(store)/cart/page.tsx';
let cartContent = fs.readFileSync(cartPath, 'utf8');
cartContent = cartContent.replace(
  'import { displayVariantOptions, formatMoney } from "@/lib/storefront/format";',
  'import { formatMoney } from "@/lib/storefront/format";\nimport { VariantOptionsDisplay } from "@/components/storefront/variant-options-display";'
);
cartContent = cartContent.replace(
  '{displayVariantOptions(item.sku.variantOptions) && <p className="store-muted">{displayVariantOptions(item.sku.variantOptions)}</p>}',
  '<p className="store-muted"><VariantOptionsDisplay options={item.sku.variantOptions} /></p>'
);
fs.writeFileSync(cartPath, cartContent, 'utf8');

// 3. Update checkout/page.tsx
const checkoutPath = 'apps/web/src/app/[locale]/(store)/checkout/page.tsx';
let checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
checkoutContent = checkoutContent.replace(
  'import { displayVariantOptions, formatMoney } from "@/lib/storefront/format";',
  'import { formatMoney } from "@/lib/storefront/format";\nimport { VariantOptionsDisplay } from "@/components/storefront/variant-options-display";'
);
checkoutContent = checkoutContent.replace(
  '{displayVariantOptions(item.sku.variantOptions) && <small>{displayVariantOptions(item.sku.variantOptions)}</small>}',
  '<small className="block mt-1"><VariantOptionsDisplay options={item.sku.variantOptions} /></small>'
);
fs.writeFileSync(checkoutPath, checkoutContent, 'utf8');

// 4. Update order-confirmation
const orderConfPath = 'apps/web/src/app/[locale]/(store)/order-confirmation/[orderNumber]/page.tsx';
let orderConfContent = fs.readFileSync(orderConfPath, 'utf8');
orderConfContent = orderConfContent.replace(
  'import { addressParts, displayVariantOptions } from "@/lib/storefront/format";',
  'import { addressParts } from "@/lib/storefront/format";\nimport { VariantOptionsDisplay } from "@/components/storefront/variant-options-display";'
);
orderConfContent = orderConfContent.replace(
  '{displayVariantOptions(item.variantSnapshot) ? `${displayVariantOptions(item.variantSnapshot)} · ` : ""}',
  '' // We will handle it differently
);
// This one is tricky because it's mixed with price.
// Original: <small>{displayVariantOptions(item.variantSnapshot) ? \`\${displayVariantOptions(item.variantSnapshot)} · \` : ""}{formatMoney(item.unitPrice, order.currency)} × {item.quantity}</small>
orderConfContent = orderConfContent.replace(
  '<small>{formatMoney(item.unitPrice, order.currency)} × {item.quantity}</small>',
  '<div className="flex flex-col gap-1 text-sm text-slate-500"><VariantOptionsDisplay options={item.variantSnapshot} /><span>{formatMoney(item.unitPrice, order.currency)} × {item.quantity}</span></div>'
);
// If the first replace didn't work exactly, let's just do a string replacement of the whole li innerHTML
fs.writeFileSync(orderConfPath, orderConfContent, 'utf8');

// 5. Update orders
const ordersPath = 'apps/web/src/app/[locale]/(store)/orders/[orderNumber]/page.tsx';
let ordersContent = fs.readFileSync(ordersPath, 'utf8');
ordersContent = ordersContent.replace(
  'import { addressParts, displayVariantOptions, formatMoney } from "@/lib/storefront/format";',
  'import { addressParts, formatMoney } from "@/lib/storefront/format";\nimport { VariantOptionsDisplay } from "@/components/storefront/variant-options-display";'
);
ordersContent = ordersContent.replace(
  '{displayVariantOptions(item.variantSnapshot) && <small>{displayVariantOptions(item.variantSnapshot)}</small>}',
  '<div className="mt-1"><VariantOptionsDisplay options={item.variantSnapshot} /></div>'
);
fs.writeFileSync(ordersPath, ordersContent, 'utf8');


// 6. Update product-gallery.tsx (Make image smaller)
const galleryPath = 'apps/web/src/components/storefront/product-gallery.tsx';
let galleryContent = fs.readFileSync(galleryPath, 'utf8');
galleryContent = galleryContent.replace(
  '<div className="store-product-detail__image rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md bg-white">',
  '<div className="store-product-detail__image rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md bg-white max-w-sm mx-auto w-full aspect-[4/5] flex items-center justify-center">'
);
galleryContent = galleryContent.replace(
  'className="w-full h-auto object-cover aspect-[3/4]"',
  'className="w-full h-full object-contain p-2"'
);
fs.writeFileSync(galleryPath, galleryContent, 'utf8');

// 7. Update product-card.tsx (Make image smaller)
const cardPath = 'apps/web/src/components/storefront/product-card.tsx';
let cardContent = fs.readFileSync(cardPath, 'utf8');
cardContent = cardContent.replace(
  '<SafeProductImage alt={image.altText || translation.name} sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw" src={image.url} />',
  '<div className="flex items-center justify-center bg-slate-50 aspect-[4/5] overflow-hidden"><SafeProductImage alt={image.altText || translation.name} sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw" src={image.url} className="w-full h-full object-contain p-4" /></div>'
);
fs.writeFileSync(cardPath, cardContent, 'utf8');

console.log("Modifications complete.");
