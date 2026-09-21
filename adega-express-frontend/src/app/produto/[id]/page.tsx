// src/app/produto/[id]/page.tsx
'use client';

import { useEffect, useState, use } from 'react';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus } from 'lucide-react';

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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [resolvedParams.id]);

  const handleAdd = () => {
    if (product) {
      addItem(product, quantity);
      alert('Adicionado ao carrinho!');
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!product) return <div>Produto não encontrado</div>;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="inline-flex items-center text-red-600 hover:text-red-700 mb-8 font-medium">
          <ArrowLeft size={20} className="mr-1" />
          Voltar ao catálogo
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10 flex flex-col md:flex-row gap-10">
          <div className="w-full md:w-1/2 aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-lg">
            Imagem {product.name}
          </div>
          
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wide">{product.category.name}</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-lg text-gray-500 mb-6">{product.brand}</p>
            
            <div className="text-3xl font-bold text-gray-900 mb-8">
              R$ {Number(product.price).toFixed(2).replace('.', ',')}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Detalhes</h3>
              <ul className="text-gray-600 space-y-1">
                <li><strong>Volume:</strong> {product.volume_ml} ml</li>
                <li><strong>Teor Alcoólico:</strong> {product.abv_percent}%</li>
              </ul>
              {product.description && (
                <p className="mt-4 text-gray-600">{product.description}</p>
              )}
            </div>

            <div className="mt-auto flex flex-col sm:flex-row gap-4">
              {product.in_stock ? (
                <>
                  <div className="flex items-center border rounded-lg w-full sm:w-auto h-12">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-gray-100 text-gray-600 rounded-l-lg h-full flex items-center justify-center">
                      <Minus size={20} />
                    </button>
                    <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 hover:bg-gray-100 text-gray-600 rounded-r-lg h-full flex items-center justify-center">
                      <Plus size={20} />
                    </button>
                  </div>
                  <button onClick={handleAdd} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors h-12 flex items-center justify-center">
                    Adicionar ao Carrinho
                  </button>
                </>
              ) : (
                <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-3 px-6 rounded-lg cursor-not-allowed">
                  Produto Esgotado
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
