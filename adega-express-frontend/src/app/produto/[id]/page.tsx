'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProductArtwork from '@/components/ProductArtwork';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, ArrowLeft, Plus, Minus } from 'lucide-react';
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
      <div className="min-h-screen bg-zinc-950 text-white">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
          Carregando produto...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
          <h1 className="text-2xl font-bold">Produto não encontrado</h1>
          <Link
            href="/#catalogo"
            className="inline-flex items-center gap-2 h-10 px-6 rounded bg-amber-600 text-black font-bold text-xs uppercase tracking-wider"
          >
            <ArrowLeft size={15} /> Voltar ao Catálogo
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
      toast.success(`${safeQty}x ${product.name} adicionado ao carrinho!`);
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-white font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-amber-500 mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} /> Voltar
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-10">
          {/* Image */}
          <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-8 flex items-center justify-center min-h-[360px] group">
            <ProductArtwork
              name={product.name}
              brand={product.brand}
              categoryName={product.category?.name}
              volumeMl={product.volume_ml}
              imageUrl={product.image_url}
              size="lg"
              className="w-full h-72"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                  {product.brand} • {product.volume_ml} mL
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                    outOfStock
                      ? 'bg-red-950 text-red-300 border border-red-700/40'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700/40'
                  }`}
                >
                  {outOfStock ? 'Em Falta' : `${product.stock_quantity} em estoque`}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-black text-white">
                {product.name}
              </h1>

              {product.description && (
                <p className="text-sm text-zinc-400 leading-relaxed">{product.description}</p>
              )}

              <div className="pt-2">
                <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
                  Preço Unitário
                </span>
                <span className="text-3xl font-black text-amber-500">
                  R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                </span>
              </div>

              {!outOfStock && (
                <div className="pt-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Quantidade
                  </label>
                  <div className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-950 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="h-9 w-9 flex items-center justify-center text-white hover:bg-zinc-800 rounded cursor-pointer"
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
                      className="w-14 bg-transparent text-center text-sm font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      className="h-9 w-9 flex items-center justify-center text-white hover:bg-zinc-800 rounded cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAddToCart}
              className={`w-full h-12 rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${
                outOfStock
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-black cursor-pointer'
              }`}
            >
              <ShoppingCart size={17} />
              <span>{outOfStock ? 'Produto em Falta' : 'Adicionar ao Carrinho'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
