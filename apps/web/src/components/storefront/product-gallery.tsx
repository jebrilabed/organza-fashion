"use client";

import { useState, useEffect, useRef } from "react";

import { SafeProductImage } from "@/components/storefront/safe-product-image";
import { storefrontMessages as messages } from "@/lib/storefront/messages";

type ImageType = {
  url: string;
  altText: string | null;
};

export function ProductGallery({ images, altPrefix }: { images: ImageType[], altPrefix: string }) {
  const [mainImage, setMainImage] = useState<ImageType | null>(images.length > 0 ? images[0] : null);

  const currentIndex = mainImage ? images.findIndex(img => img.url === mainImage.url) : 0;
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scrollThumbnails = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -250 : 250;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const prevIndex = (safeIndex - 1 + images.length) % images.length;
    setMainImage(images[prevIndex]);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length <= 1) return;
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (safeIndex + 1) % images.length;
    setMainImage(images[nextIndex]);
  };

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
      <div className="store-product-detail__image rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm transition-all duration-300 hover:shadow-md bg-slate-50 w-full max-w-[490px] mx-auto relative aspect-[4/5] lg:aspect-square group">
        <SafeProductImage
          alt={mainImage.altText || altPrefix}
          sizes="(max-width: 960px) 100vw, 50vw"
          priority
          src={mainImage.url}
        />
      </div>

      {images.length > 1 && (
        <div className="relative group/thumbs mt-3">
          {/* Scroll Right (Previous in RTL) */}
          <button
            type="button"
            onClick={() => scrollThumbnails('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 shadow-md transition-all duration-300 hover:scale-110 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] z-20"
            aria-label="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          
          {/* Scroll Left (Next in RTL) */}
          <button
            type="button"
            onClick={() => scrollThumbnails('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 shadow-md transition-all duration-300 hover:scale-110 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] z-20"
            aria-label="Scroll left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>

          <div ref={scrollRef} className="flex flex-nowrap overflow-x-auto gap-3 pb-2 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {images.map((image, index) => {
              const isSelected = mainImage.url === image.url;
              return (
                <button
                  type="button"
                  key={`${image.url}-${index}`}
                  onClick={() => setMainImage(image)}
                  className={`store-product-detail__thumbnail shrink-0 w-20 sm:w-24 snap-start relative rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-[3/4] focus:outline-none ${isSelected
                    ? "border-[var(--color-primary)] shadow-md z-10"
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-slate-300 hover:shadow-sm"
                    }`}
                >
                  <SafeProductImage
                    alt={image.altText || `${altPrefix} ${index + 1}`}
                    sizes="120px"
                    src={image.url}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
