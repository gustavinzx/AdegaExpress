// src/app/produto/[id]/page.tsx
'use client';

import { useEffect, useState, use } from 'react';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus, Droplets, ShoppingCart, PackageCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProdutoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get<Product>(`/products/${resolvedParams.id}`);
        setProduct(res);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchProduct();
  }, [resolvedParams.id]);

  const handleAdd = () => {
    if (!product) return;
    const ok = addItem(product, quantity);
    if (ok) {
      toast.success(`${quantity}x ${product.name} adicionado ao carrinho!`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-amber-500 font-black uppercase tracking-widest animate-pulse">
          Carregando detalhes do produto...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black uppercase tracking-wider mb-2">
            Produto não encontrado
          </h1>
          <p className="text-zinc-400 text-sm mb-6">
            Este item não está disponível no catálogo ativo de bebidas não alcoólicas.
          </p>
          <Link
            href="/#catalogo"
            className="inline-flex items-center gap-2 bg-amber-600 text-black font-black uppercase tracking-widest text-xs px-6 py-3 rounded hover:bg-amber-500 transition-colors"
          >
            <ArrowLeft size={16} /> Voltar ao Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const outOfStock = !product.in_stock || product.stock_quantity <= 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/#catalogo"
          className="inline-flex items-center text-amber-500 hover:text-amber-400 mb-8 text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar ao catálogo
        </Link>

        <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-6 md:p-10 flex flex-col md:flex-row gap-10">
          {/* Imagem / Representação */}
          <div className="w-full md:w-1/2 aspect-square bg-gradient-to-b from-zinc-800/50 to-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center p-8 relative">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <Droplets size={64} className="text-amber-500 mb-3" />
                <span className="text-xs font-black uppercase tracking-widest text-amber-500">
                  {product.brand}
                </span>
                <span className="text-base font-bold text-white mt-1">{product.name}</span>
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest">
                {product.category?.name}
              </span>
              {outOfStock ? (
                <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                  Em Falta
                </span>
              ) : (
                <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded flex items-center gap-1">
                  <PackageCheck size={12} /> {product.stock_quantity} un. disponíveis
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-serif font-black text-white mb-1">
              {product.name}
            </h1>
            <p className="text-sm text-zinc-400 font-bold uppercase tracking-wider mb-6">
              Marca: <span className="text-zinc-200">{product.brand}</span>
            </p>

            <div className="text-3xl font-black text-amber-500 mb-6">
              R$ {Number(product.price).toFixed(2).replace('.', ',')}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
                Especificações do Produto
              </h2>
              <ul className="text-xs text-zinc-300 space-y-2">
                <li className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">Categoria:</span>
                  <span className="font-bold text-white">{product.category?.name}</span>
                </li>
                <li className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">Volume da Embalagem:</span>
                  <span className="font-bold text-white">{product.volume_ml} ml</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-500">Classificação:</span>
                  <span className="font-bold text-emerald-400">Bebida Não Alcoólica</span>
                </li>
              </ul>
              {product.description && (
                <p className="mt-4 pt-3 border-t border-zinc-900 text-xs text-zinc-300 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            <div className="mt-auto">
              {!outOfStock ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center border border-zinc-700 bg-zinc-950 rounded-lg h-12">
                      <button
                        type="button"
                        aria-label="Diminuir quantidade"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 h-full hover:bg-zinc-800 text-zinc-300 rounded-l-lg flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={product.stock_quantity}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!Number.isNaN(val)) {
                            setQuantity(Math.max(1, Math.min(product.stock_quantity, val)));
                          }
                        }}
                        aria-label="Quantidade"
                        className="w-16 text-center font-bold text-white bg-transparent focus:outline-none text-sm"
                      />
                      <button
                        type="button"
                        aria-label="Aumentar quantidade"
                        onClick={() =>
                          setQuantity(Math.min(product.stock_quantity, quantity + 1))
                        }
                        className="px-4 h-full hover:bg-zinc-800 text-zinc-300 rounded-r-lg flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAdd}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest text-xs py-3 px-6 rounded-lg transition-colors h-12 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} /> Adicionar ao Carrinho
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Suporte a compras em maior quantidade para eventos e confraternizações (RF17), limitado ao saldo em estoque ({product.stock_quantity} un.).
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full bg-zinc-950 border border-red-900/40 text-red-400 font-black uppercase tracking-widest text-xs py-4 px-6 rounded-lg cursor-not-allowed"
                >
                  Produto Em Falta — Indisponível para Compra (RN03)
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
