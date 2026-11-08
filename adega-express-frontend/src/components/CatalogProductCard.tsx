'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Product } from '@/types';
import { getProductGallery } from '@/lib/productGallery';
import ProductArtwork from './ProductArtwork';

interface CatalogProductCardProps {
  product: Product;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export default function CatalogProductCard({ product, onAddToCart }: CatalogProductCardProps) {
  const isOutOfStock = product.stock_quantity <= 0 || product.in_stock === false;
  const gallery = getProductGallery(product);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [imageError, setImageError] = useState(false);

  const currentImage = gallery[activeImageIdx] || gallery[0];

  return (
    <div className="group bg-white rounded-3xl border border-slate-200 hover:border-teal-400/60 hover:shadow-lg transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
      {/* Top Floating Badge Bar */}
      <div className="flex items-center justify-between gap-1 mb-2 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 text-[10px] font-bold text-teal-800 tracking-wide uppercase">
          <ShieldCheck size={11} className="text-teal-700" />
          <span>0,0%</span>
        </span>

        {isOutOfStock ? (
          <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            Esgotado
          </span>
        ) : product.stock_quantity <= 5 ? (
          <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Últimas {product.stock_quantity} un.
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            <Sparkles size={10} />
            <span>Gelada</span>
          </span>
        )}
      </div>

      {/* Artwork Display Container with Multi-Angle Previews */}
      <div className="relative">
        <Link href={`/produto/${product.id}`} className="block">
          <div className="relative h-52 w-full rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/60 border border-slate-100 flex items-center justify-center overflow-hidden group-hover:bg-teal-50/20 transition-colors p-3">
            {currentImage?.url && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImage.url}
                alt={`${product.name} - ${currentImage.label}`}
                onError={() => setImageError(true)}
                className="h-full w-full object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <ProductArtwork
                name={product.name}
                brand={product.brand}
                categoryName={product.category?.name}
                volumeMl={product.volume_ml}
                imageUrl={product.image_url}
                size="md"
                className="h-full w-full"
              />
            )}
          </div>
        </Link>

        {/* Multi-angle Mini Carousel Dot Controls (On-card switcher) */}
        {gallery.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {gallery.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImageIdx(idx);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  activeImageIdx === idx ? 'w-5 bg-teal-700' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                title={img.label}
                aria-label={`Ver ${img.label}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Meta */}
      <Link href={`/produto/${product.id}`} className="block mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="uppercase tracking-wider text-teal-800">{product.brand}</span>
          <span>{product.volume_ml} mL</span>
        </div>

        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1 leading-snug">
          {product.name}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {product.description || 'Bebida não alcoólica refrescante, conservada em temperatura ideal.'}
        </p>

        <div className="flex items-center gap-1 pt-1 text-[11px] text-amber-600 font-bold">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <span>4.9</span>
          <span className="text-slate-400 font-normal">• 100% Não Alcoólico</span>
        </div>
      </Link>

      {/* Price & Action Button */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-none">
            Preço
          </span>
          <span className="text-lg font-black text-slate-900">
            R$ {Number(product.price).toFixed(2).replace('.', ',')}
          </span>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={(e) => onAddToCart(product, e)}
          className={`h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              : 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs hover:shadow-md active:scale-95'
          }`}
        >
          <ShoppingBag size={14} />
          <span>{isOutOfStock ? 'Esgotado' : 'Comprar'}</span>
        </button>
      </div>
    </div>
  );
}
