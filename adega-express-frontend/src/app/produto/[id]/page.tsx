'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProductArtwork from '@/components/ProductArtwork';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import {
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  Plus,
  Minus,
  PackageCheck,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const prod = await api.get<Product>(`/products/${id}`);
        setProduct(prod);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) void fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0c0a] text-[#f4efe6]">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 h-[480px] rounded-3xl bg-[#161310] border border-[#c9a256]/15 animate-pulse" />
          <div className="lg:col-span-6 space-y-6 py-6">
            <div className="h-4 w-32 bg-[#161310] rounded animate-pulse" />
            <div className="h-12 w-3/4 bg-[#161310] rounded animate-pulse" />
            <div className="h-24 w-full bg-[#161310] rounded animate-pulse" />
            <div className="h-16 w-48 bg-[#161310] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0e0c0a] text-[#f4efe6]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
          <h1 className="font-serif text-4xl font-semibold">Rótulo não encontrado</h1>
          <p className="text-sm text-[#9e9589]">
            O produto solicitado não está disponível no catálogo ativo.
          </p>
          <Link
            href="/#catalogo"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#c9a256] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.16em]"
          >
            <ArrowLeft size={15} /> Voltar à Vitrine
          </Link>
        </div>
      </div>
    );
  }

  const outOfStock = !product.in_stock || product.stock_quantity <= 0;
  const maxQty = Math.max(1, product.stock_quantity);

  const handleAddToCart = () => {
    const safeQty = Math.min(Math.max(1, quantity), product.stock_quantity);
    const added = addItem(product, safeQty);
    if (added) {
      toast.success(`${safeQty}x ${product.name} adicionado à sacola!`);
    }
  };

  return (
    <div className="bg-[#0e0c0a] min-h-screen text-[#f4efe6] font-sans">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9e9589] hover:text-[#c9a256] mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} /> Voltar ao Catálogo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Studio Showcase */}
          <div className="lg:col-span-6 rounded-3xl border border-[#c9a256]/20 bg-gradient-to-b from-[#1b1612] to-[#120f0c] p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[440px] group">
            <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
              <span className="rounded-full border border-[#c9a256]/25 bg-[#0e0c0a]/80 px-3.5 py-1 text-xs font-mono text-[#c9a256]">
                {product.category?.name || 'Bebida Não Alcoólica'}
              </span>
              {outOfStock ? (
                <span className="rounded-full bg-red-950/90 border border-red-500/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-200">
                  Em Falta (RN03)
                </span>
              ) : (
                <span className="rounded-full bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-1 text-xs font-mono text-emerald-300">
                  {product.stock_quantity} un. disponíveis
                </span>
              )}
            </div>

            <ProductArtwork
              name={product.name}
              brand={product.brand}
              categoryName={product.category?.name}
              volumeMl={product.volume_ml}
              imageUrl={product.image_url}
              size="lg"
              className="w-full h-80 my-4"
            />
          </div>

          {/* Right Specifications & Purchase Console */}
          <div className="lg:col-span-6 rounded-3xl border border-[#c9a256]/20 bg-[#14110e] p-8 sm:p-10 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c9a256]">
                  {product.brand}
                </span>
                <span className="text-[#c9a256]/30">•</span>
                <span className="text-xs font-mono text-[#9e9589]">
                  {product.volume_ml} mL • 0,0% Álcool
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#f4efe6] leading-tight">
                {product.name}
              </h1>

              <p className="text-sm sm:text-base text-[#9e9589] leading-relaxed">
                {product.description ||
                  'Bebida não alcoólica selecionada, conservada em temperatura ideal e pronta para consumo individual, familiar ou recepções.'}
              </p>

              {/* Price & Stock Box */}
              <div className="rounded-2xl border border-[#c9a256]/15 bg-[#0e0c0a] p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-[#9e9589]">
                    Preço Unitário
                  </span>
                  <span className="font-mono text-3xl font-bold text-[#f4efe6]">
                    R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-[#9e9589]">
                    Disponibilidade Imediata
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      outOfStock ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {outOfStock
                      ? 'Produto temporariamente esgotado'
                      : `${product.stock_quantity} unidades em estoque`}
                  </span>
                </div>
              </div>

              {/* Quantity Selector for Home or Events (RF17) */}
              {!outOfStock && (
                <div className="space-y-2 pt-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9e9589]">
                    Quantidade (Consumo Doméstico ou Eventos — RF17)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center rounded-full border border-[#c9a256]/25 bg-[#0e0c0a] p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="h-10 w-10 rounded-full flex items-center justify-center text-[#f4efe6] hover:bg-[#1c1814] cursor-pointer"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={maxQty}
                        value={quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (Number.isNaN(v)) setQuantity(1);
                          else setQuantity(Math.min(Math.max(1, v), maxQty));
                        }}
                        className="w-16 bg-transparent text-center font-mono text-sm font-semibold text-[#f4efe6] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                        className="h-10 w-10 rounded-full flex items-center justify-center text-[#f4efe6] hover:bg-[#1c1814] cursor-pointer"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      {[6, 12, 24]
                        .filter((pack) => pack <= maxQty)
                        .map((pack) => (
                          <button
                            key={pack}
                            type="button"
                            onClick={() => setQuantity(pack)}
                            className="h-10 px-3 rounded-full border border-[#c9a256]/20 bg-[#0e0c0a] hover:border-[#c9a256] text-xs font-mono text-[#c9a256] transition-all cursor-pointer"
                          >
                            +{pack} un.
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-[#c9a256]/15">
              <button
                type="button"
                disabled={outOfStock}
                onClick={handleAddToCart}
                className={`w-full h-14 rounded-full font-semibold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                  outOfStock
                    ? 'bg-[#1f1b18] text-[#9e9589]/50 cursor-not-allowed border border-white/5'
                    : 'bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] cursor-pointer shadow-[0_10px_30px_rgba(201,162,86,0.28)]'
                }`}
              >
                <ShoppingBag size={18} />
                <span>
                  {outOfStock
                    ? 'Produto Esgotado (Indisponível)'
                    : `Adicionar ${quantity} un. à Sacola — R$ ${(parseFloat(product.price) * quantity).toFixed(2).replace('.', ',')}`}
                </span>
              </button>

              <div className="grid grid-cols-3 gap-3 pt-2 text-[11px] text-[#9e9589]">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#c9a256] shrink-0" />
                  <span>100% Sem Álcool</span>
                </div>
                <div className="flex items-center gap-2">
                  <PackageCheck size={14} className="text-[#c9a256] shrink-0" />
                  <span>Reserva Imediata</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-[#c9a256] shrink-0" />
                  <span>Entrega Local</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
