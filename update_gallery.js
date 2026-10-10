const fs = require('fs');
const path = require('path');

// 1. Create ProductGallery component
const galleryPath = 'apps/web/src/components/storefront/product-gallery.tsx';
const galleryContent = `"use client";

import { useState, useEffect } from "react";
import { SafeProductImage } from "@/components/storefront/safe-product-image";
import { storefrontMessages as messages } from "@/lib/storefront/messages";

type ImageType = {
  url: string;
  altText: string | null;
};

export function ProductGallery({ images, altPrefix }: { images: ImageType[], altPrefix: string }) {
  const [mainImage, setMainImage] = useState<ImageType | null>(images.length > 0 ? images[0] : null);

  useEffect(() => {
    const handler = (e: any) => {
      const newUrl = e.detail;
      if (!newUrl) return;
      const found = images.find(img => img.url === newUrl) || { url: newUrl, altText: altPrefix };
      setMainImage(found);
    };
    window.addEventListener("updateProductImage", handler);
    return () => window.removeEventListener("updateProductImage", handler);
  }, [images, altPrefix]);

  if (!mainImage) {
    return (
      <div className="store-product-detail__gallery">
        <div className="store-product-detail__image rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center aspect-[3/4] bg-slate-50">
          <span className="store-image-empty text-slate-400 font-medium">{messages.ar.noImage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="store-product-detail__gallery flex flex-col gap-4">
      <div className="store-product-detail__image rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md bg-white">
        <SafeProductImage 
          alt={mainImage.altText || altPrefix} 
          sizes="(max-width: 960px) 100vw, 50vw" 
          priority 
          src={mainImage.url}
          className="w-full h-auto object-cover aspect-[3/4]"
        />
      </div>
      
      {images.length > 1 && (
        <div className="store-product-detail__thumbnails grid grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((image, index) => {
            const isSelected = mainImage.url === image.url;
            return (
              <button
                type="button"
                key={\`\${image.url}-\${index}\`}
                onClick={() => setMainImage(image)}
                className={\`store-product-detail__thumbnail relative rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-[3/4] focus:outline-none \${
                  isSelected 
                    ? "border-[var(--color-primary)] shadow-md scale-105 z-10" 
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-slate-300 hover:shadow-sm"
                }\`}
              >
                <SafeProductImage 
                  alt={image.altText || \`\${altPrefix} \${index + 1}\`} 
                  sizes="120px" 
                  src={image.url}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync(galleryPath, galleryContent, 'utf8');

// 2. Update page.tsx
const pagePath = 'apps/web/src/app/[locale]/(store)/products/[slug]/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Add import
pageContent = pageContent.replace(
  'import { SafeProductImage } from "@/components/storefront/safe-product-image";',
  'import { SafeProductImage } from "@/components/storefront/safe-product-image";\nimport { ProductGallery } from "@/components/storefront/product-gallery";'
);

// Replace gallery static HTML
const oldGalleryHTML = `          <div className="store-product-detail__gallery">
            <div className="store-product-detail__image">
              {firstImage ? <SafeProductImage alt={firstImage.altText || translation.name} sizes="(max-width: 960px) 100vw, 50vw" priority src={firstImage.url} /> : <span className="store-image-empty">{messages.ar.noImage}</span>}
            </div>
            {product.images.length > 1 && <div className="store-product-detail__thumbnails">{product.images.slice(1).map((image, index) => <div className="store-product-detail__thumbnail" key={\`\${image.url}-\${index}\`}><SafeProductImage alt={image.altText || \`\${translation.name} \${index + 2}\`} sizes="84px" src={image.url} /></div>)}</div>}
          </div>`;

const newGalleryHTML = `          <ProductGallery 
            images={product.images.map(img => ({ url: img.url, altText: img.altText }))} 
            altPrefix={translation.name} 
          />`;

pageContent = pageContent.replace(oldGalleryHTML, newGalleryHTML);
fs.writeFileSync(pagePath, pageContent, 'utf8');

// 3. Update ProductVariantSelector
const selectorPath = 'apps/web/src/components/storefront/product-variant-selector.tsx';
let selectorContent = fs.readFileSync(selectorPath, 'utf8');

const oldDOM = `    if (colorData?.imageUrl) {
      const img = document.querySelector('.store-product-detail__image img') as HTMLImageElement;
      if (img) {
        img.srcset = '';
        img.src = colorData.imageUrl;
      }
    }`;

const newEvent = `    if (colorData?.imageUrl) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("updateProductImage", { detail: colorData.imageUrl }));
      }
    }`;

selectorContent = selectorContent.replace(oldDOM, newEvent);
fs.writeFileSync(selectorPath, selectorContent, 'utf8');

console.log("Gallery built successfully.");
