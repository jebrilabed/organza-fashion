const fs = require('fs');
const path = 'apps/web/src/components/storefront/product-gallery.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add lucide-react import
if (!content.includes('lucide-react')) {
  content = content.replace(
    'import { SafeProductImage }',
    'import { ChevronLeft, ChevronRight } from "lucide-react";\nimport { SafeProductImage }'
  );
}

// 2. Add navigation handlers inside the component
if (!content.includes('handleNext')) {
  content = content.replace(
    '  useEffect(() => {',
    `  const currentIndex = mainImage ? images.findIndex(img => img.url === mainImage.url) : 0;
  
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

  useEffect(() => {`
  );
}

// 3. Add the arrows overlay and update the image container class for the hover group
const imageDivTarget = '<div className="store-product-detail__image rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm transition-all duration-300 hover:shadow-md bg-slate-50 w-full max-w-[490px] mx-auto relative aspect-[4/5] lg:aspect-square">';
const imageDivReplacement = '<div className="store-product-detail__image rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm transition-all duration-300 hover:shadow-md bg-slate-50 w-full max-w-[490px] mx-auto relative aspect-[4/5] lg:aspect-square group">';
content = content.replace(imageDivTarget, imageDivReplacement);

// 4. Update the image className to add a nice zoom on hover
content = content.replace(
  'className="absolute inset-0 w-full h-full object-cover"',
  'className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"'
);

// 5. Insert the arrows after the SafeProductImage but inside the group div
const safeProductImageEnd = 'className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"\n        />';
const arrowsHtml = `
        {images.length > 1 && (
          <>
            {/* Right Arrow (Previous in RTL) */}
            <button
              onClick={handlePrev}
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-white/60 text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.12)] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] translate-x-4 group-hover:translate-x-0 z-10"
              aria-label="Previous image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            {/* Left Arrow (Next in RTL) */}
            <button
              onClick={handleNext}
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-white/60 text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.12)] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] -translate-x-4 group-hover:translate-x-0 z-10"
              aria-label="Next image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </>
        )}`;
content = content.replace(safeProductImageEnd, safeProductImageEnd + arrowsHtml);

fs.writeFileSync(path, content, 'utf8');
console.log("Added creative navigation arrows to product-gallery.tsx");
