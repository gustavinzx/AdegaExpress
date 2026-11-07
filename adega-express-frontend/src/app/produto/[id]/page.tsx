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
  Plus,
  Minus,
  PackageCheck,
  Check,
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
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 h-[460px] rounded-3xl bg-slate-200 animate-pulse" />
          <div className="lg:col-span-6 space-y-6 py-6">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 w-3/4 bg-slate-200 rounded animate-pulse" />
            <div className="h-20 w-full bg-slate-200 rounded animate-pulse" />
            <div className="h-16 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
          <h1 className="text-2xl font-extrabold text-slate-900">Produto não encontrado</h1>
          <p className="text-xs text-slate-500">
            O produto solicitado não está disponível no catálogo ativo.
          </p>
          <Link
            href="/#catalogo"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            <ArrowLeft size={14} /> Voltar ao Catálogo
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
    <div className="bg-[#F8FAFC] min-h-screen text-slate-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-teal-700 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Voltar ao Catálogo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Studio Showcase */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xs min-h-[440px]">
            <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {product.category?.name || 'Bebida Não Alcoólica'}
              </span>
              {outOfStock ? (
                <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700">
                  Em Falta
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                  {product.stock_quantity} unidades disponíveis
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
              className="w-full h-72 my-4"
            />
          </div>

          {/* Right Specifications & Purchase Console */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  {product.brand}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-500">
                  {product.volume_ml} mL • 0,0% Álcool
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                {product.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description ||
                  'Bebida não alcoólica selecionada, conservada em temperatura ideal e pronta para consumo individual, familiar ou recepções.'}
              </p>

              {/* Price & Stock Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">
                    Preço Unitário
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">
                    Disponibilidade
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      outOfStock ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {outOfStock
                      ? 'Produto esgotado no momento'
                      : `${product.stock_quantity} unidades em estoque`}
                  </span>
                </div>
              </div>

              {/* Quantity Selector */}
              {!outOfStock && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Quantidade
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer"
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
                          const val = parseInt(e.target.value) || 1;
                          setQuantity(Math.min(Math.max(1, val), maxQty));
                        }}
                        className="w-14 text-center bg-transparent text-sm font-bold text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-xs text-slate-500">
                      Total:{' '}
                      <strong className="text-slate-900">
                        R${' '}
                        {(parseFloat(product.price) * Math.min(quantity, maxQty))
                          .toFixed(2)
                          .replace('.', ',')}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions & Assurance */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={outOfStock}
                onClick={handleAddToCart}
                className={`w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  outOfStock
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                }`}
              >
                <ShoppingBag size={16} />
                <span>{outOfStock ? 'Produto Esgotado' : 'Adicionar à Sacola'}</span>
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Truck size={14} className="text-teal-700 shrink-0" />
                  <span>Entrega Rápida</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck size={14} className="text-teal-700 shrink-0" />
                  <span>0,0% Álcool</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
