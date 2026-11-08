'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ShieldCheck, ZoomIn, Eye } from 'lucide-react';
import { GalleryImage } from '@/lib/productGallery';
import ProductArtwork from './ProductArtwork';

interface ProductGalleryCarouselProps {
  productName: string;
  brand: string;
  categoryName?: string;
  volumeMl?: number;
  images: GalleryImage[];
  outOfStock?: boolean;
}

export default function ProductGalleryCarousel({
  productName,
  brand,
  categoryName,
  volumeMl,
  images,
  outOfStock = false,
}: ProductGalleryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const [isZoomed, setIsZoomed] = useState(false);

  const activeImage = images[currentIndex] || images[0];
  const hasError = imageErrorMap[activeImage?.id];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleError = (id: string) => {
    setImageErrorMap((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main Display Stage */}
      <div className="relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col items-center justify-center overflow-hidden shadow-xs min-h-[460px] group">
        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 shadow-2xs">
              <ShieldCheck size={13} className="text-teal-700" />
              <span>0,0% Álcool</span>
            </span>
            <span className="hidden sm:inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {activeImage?.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {outOfStock ? (
              <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700 shadow-2xs">
                Em Falta
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-2xs">
                <Sparkles size={12} className="text-emerald-600" />
                <span>Pronta Entrega</span>
              </span>
            )}
          </div>
        </div>

        {/* Central Display Image */}
        <div
          className={`relative w-full h-80 sm:h-96 flex items-center justify-center transition-transform duration-500 cursor-pointer ${
            isZoomed ? 'scale-115' : 'hover:scale-[1.03]'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
          title="Clique para alternar zoom"
        >
          {activeImage?.url && !hasError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeImage.url}
              alt={`${productName} - ${activeImage.label}`}
              onError={() => handleError(activeImage.id)}
              className="h-full w-full max-h-80 sm:max-h-96 object-contain drop-shadow-md select-none transition-all duration-300"
            />
          ) : (
            <ProductArtwork
              name={productName}
              brand={brand}
              categoryName={categoryName}
              volumeMl={volumeMl}
              imageUrl={images[0]?.url}
              size="lg"
              className="w-full h-80"
            />
          )}
        </div>

        {/* Carousel Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Imagem anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 hover:bg-white border border-slate-200 text-slate-700 hover:text-teal-700 flex items-center justify-center shadow-md backdrop-blur-xs transition-all cursor-pointer opacity-90 hover:opacity-100 hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Próxima imagem"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 hover:bg-white border border-slate-200 text-slate-700 hover:text-teal-700 flex items-center justify-center shadow-md backdrop-blur-xs transition-all cursor-pointer opacity-90 hover:opacity-100 hover:scale-110 active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Bottom Bar: Image Counter & Zoom Indicator */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-500 pointer-events-none">
          <span className="rounded-full bg-slate-900/70 text-white font-mono text-[11px] px-2.5 py-0.5 backdrop-blur-xs">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200 backdrop-blur-xs">
            <ZoomIn size={12} className="text-teal-700" />
            <span>{isZoomed ? 'Reduzir' : 'Ampliar'}</span>
          </span>
        </div>
      </div>

      {/* Thumbnails Ribbon */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {images.map((img, idx) => {
            const isActive = idx === currentIndex;
            const thumbError = imageErrorMap[img.id];

            return (
              <button
                key={img.id}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsZoomed(false);
                }}
                className={`group relative flex flex-col items-center rounded-2xl border p-2 transition-all cursor-pointer bg-white ${
                  isActive
                    ? 'border-teal-600 ring-2 ring-teal-600/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="h-14 w-full flex items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                  {img.url && !thumbError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.url}
                      alt={img.label}
                      className="h-full w-full object-contain p-0.5 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Eye size={16} className="text-slate-400" />
                  )}
                </div>
                <span
                  className={`mt-1.5 truncate text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? 'text-teal-800' : 'text-slate-600'
                  }`}
                >
                  {img.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
