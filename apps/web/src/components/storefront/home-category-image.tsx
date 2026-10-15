"use client";

import { SafeProductImage } from "./safe-product-image";

export function HomeCategoryImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  return (
    <span className="store-home__category-image">
      <SafeProductImage alt={alt} sizes={sizes} src={src} />
    </span>
  );
}