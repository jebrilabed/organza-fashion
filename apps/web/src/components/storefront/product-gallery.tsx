"use client";

import { useState, useEffect } from "react";

import { SafeProductImage } from "@/components/storefront/safe-product-image";
import { storefrontMessages as messages } from "@/lib/storefront/messages";

type ImageType = {
  url: string;
  altText: string | null;
};

export function ProductGallery({ images, altPrefix, initialImageUrl }: { images: ImageType[], altPrefix: string; initialImageUrl?: string }) {
  const [mainImage, setMainImage] = useState<ImageType | null>(() =>
    images.find((image) => image.url === initialImageUrl) ?? images[0] ?? null
  );
  const [thumbnailPage, setThumbnailPage] = useState(0);
  const pageCount = Math.ceil(images.length / 5);
  const visibleImages = images.slice(thumbnailPage * 5, thumbnailPage * 5 + 5);

  useEffect(() => {
    const handler = (event: Event) => {
      const newUrl = (event as CustomEvent<string>).detail;
      if (!newUrl) return;
      const imageIndex = images.findIndex((image) => image.url === newUrl);
      const found = imageIndex >= 0 ? images[imageIndex] : { url: newUrl, altText: altPrefix };
      setMainImage(found);
      if (imageIndex >= 0) setThumbnailPage(Math.floor(imageIndex / 5));
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
      <div className="store-product-detail__image rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm transition-all duration-300 hover:shadow-md bg-slate-50 w-full max-w-[490px] mx-auto relative aspect-[4/5] lg:aspect-square group">
        <SafeProductImage
          key={mainImage.url}
          alt={mainImage.altText || altPrefix}
          sizes="(max-width: 960px) 100vw, 50vw"
          priority
          src={mainImage.url}
        />
      </div>

      {images.length > 1 && (
        <div className={`store-gallery-thumbnails${pageCount > 1 ? " store-gallery-thumbnails--paged" : ""}`}>
          {pageCount > 1 && <button
            aria-label={messages.ar.previous}
            className="store-gallery-thumbnails__arrow"
            disabled={thumbnailPage === 0}
            onClick={() => setThumbnailPage((page) => Math.max(0, page - 1))}
            type="button"
          ><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>}
          <div className="store-gallery-thumbnails__track">
            {visibleImages.map((image) => {
              const index = images.findIndex((item) => item.url === image.url);
              const isSelected = mainImage.url === image.url;
              return <button
                aria-current={isSelected ? "true" : undefined}
                aria-label={`${messages.ar.image} ${index + 1}`}
                className={`store-product-detail__thumbnail${isSelected ? " is-selected" : ""}`}
                key={`${image.url}-${index}`}
                onClick={() => setMainImage(image)}
                type="button"
              >
                <SafeProductImage
                  alt={image.altText || `${altPrefix} ${index + 1}`}
                  sizes="(max-width: 640px) 15vw, 68px"
                  src={image.url}
                />
              </button>;
            })}
          </div>
          {pageCount > 1 && <button
            aria-label={messages.ar.next}
            className="store-gallery-thumbnails__arrow"
            disabled={thumbnailPage === pageCount - 1}
            onClick={() => setThumbnailPage((page) => Math.min(pageCount - 1, page + 1))}
            type="button"
          ><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>}
        </div>
      )}
    </div>
  );
}
