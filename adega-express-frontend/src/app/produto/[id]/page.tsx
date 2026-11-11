'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProductGalleryCarousel from '@/components/ProductGalleryCarousel';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { getProductGallery, getProductSommelierNotes } from '@/lib/productGallery';
import {
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Sparkles,
  Thermometer,
  GlassWater,
  Leaf,
  Clock,
  Star,
  CheckCircle2,
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
  const galleryImages = getProductGallery(product);
  const sommelierNotes = getProductSommelierNotes(product);

  const handleAddToCart = () => {
    const safeQty = Math.min(Math.max(1, quantity), product.stock_quantity);
    const added = addItem(product, safeQty);
    if (added) {
      toast.success(`${safeQty}x ${product.name} adicionado à sacola!`);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-900 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-teal-700 font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
          <span>/</span>
          <Link href="/#catalogo" className="hover:text-teal-700 transition-colors">
            Catálogo
          </Link>
          <span>/</span>
          <span className="text-slate-400">{product.category?.name || 'Bebidas'}</span>
          <span>/</span>
          <span className="font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </nav>

        {/* Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Product Image Carousel with Multiple Angles */}
          <div className="lg:col-span-6">
            <ProductGalleryCarousel
              productName={product.name}
              brand={product.brand}
              categoryName={product.category?.name}
              volumeMl={product.volume_ml}
              images={galleryImages}
              outOfStock={outOfStock}
            />
          </div>

          {/* Right: Specifications & Purchase Console */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs">
            <div className="space-y-4">
              {/* Category, Brand & Rating */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                    {product.brand}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {product.volume_ml} mL • 0,0% Álcool
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>4.9</span>
                  <span className="text-slate-400 font-normal">(48)</span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                {product.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description ||
                  'Bebida não alcoólica selecionada, conservada em temperatura ideal e pronta para consumo individual, familiar ou recepções.'}
              </p>

              {/* Price & Stock Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Preço Unitário
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Disponibilidade
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold ${
                      outOfStock ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {!outOfStock && <CheckCircle2 size={13} />}
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
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
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
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-xs text-slate-500">
                      Total:{' '}
                      <strong className="text-slate-900 text-sm">
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
                    : 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs hover:shadow-sm active:scale-[0.99]'
                }`}
              >
                <ShoppingBag size={16} />
                <span>{outOfStock ? 'Produto Esgotado' : 'Adicionar à Sacola'}</span>
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Truck size={15} className="text-teal-700 shrink-0" />
                  <div>
                    <span className="font-bold block text-[11px] text-slate-800">Pronta Entrega</span>
                    <span className="text-[10px] text-slate-500">Até 45min na região</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <ShieldCheck size={15} className="text-teal-700 shrink-0" />
                  <div>
                    <span className="font-bold block text-[11px] text-slate-800">Lacre Térmico</span>
                    <span className="text-[10px] text-slate-500">Chega gelada & perfeita</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sommelier Tasting Notes & Sensory Profile (Bento Section) */}
        <section className="mt-12 space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-teal-700" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Ficha Técnica do Sommelier Não Alcoólico
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Serviço e Temperatura */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Thermometer size={20} />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Serviço Recomendado</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  <strong className="text-slate-800">Temperatura Ideal:</strong>{' '}
                  <span className="text-teal-700 font-bold">{sommelierNotes.temperaturaIdeal}</span>
                </p>
                <p>
                  <strong className="text-slate-800">Recipiente Ideal:</strong>{' '}
                  {sommelierNotes.copoRecomendado}
                </p>
                <div className="flex items-center gap-1.5 pt-2 text-slate-500 text-[11px]">
                  <Clock size={13} className="text-teal-600" />
                  <span>Resfriar 30min antes de servir</span>
                </div>
              </div>
            </div>

            {/* Card 2: Perfil Sensorial */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <GlassWater size={20} />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Perfil Sensorial</h3>
              <div className="flex flex-wrap gap-1.5">
                {sommelierNotes.perfilSensorial.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 pt-1 leading-relaxed">
                {sommelierNotes.selo}
              </p>
            </div>

            {/* Card 3: Harmonização Gastronômica */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Leaf size={20} />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Harmonização</h3>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {sommelierNotes.harmonizacao.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <strong>Ingredientes:</strong> {sommelierNotes.ingredientes}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
