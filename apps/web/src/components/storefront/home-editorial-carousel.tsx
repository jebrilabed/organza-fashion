"use client";

import { useEffect, useState } from "react";
import { SafeProductImage } from "./safe-product-image";

export function HomeEditorialCarousel({ images }: { images: { url: string }[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [images.length]);

  return (
    <div
      aria-label="صور من دار organza fashion"
      aria-roledescription="carousel"
      className="store-home__carousel"
      role="region"
    >
      <div className="store-home__carousel-track">
        {images.map((image, index) => (
          <div
            aria-hidden={index !== activeIndex}
            className={`store-home__carousel-slide${index === activeIndex ? " is-active" : ""}`}
            key={image.url}
          >
            <SafeProductImage
              alt={`تصميم من organza fashion ${index + 1}`}
              priority={index === 0}
              sizes="(max-width: 700px) 100vw, 32vw"
              src={image.url}
            />
          </div>
        ))}
      </div>
    </div>
  );
}