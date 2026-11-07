'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProductArtwork from '@/components/ProductArtwork';
import { api } from '@/lib/api';
import { Product, Category } from '@/types';
import { useCart } from '@/contexts/CartContext';
import {
  Truck,
  ShieldCheck,
  CreditCard,
  PackageCheck,
  Filter,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  GlassWater,
  Check,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

function CatalogSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="h-7 w-48 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-5 w-24 rounded-full bg-slate-200 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs"
          >
            <div className="h-52 w-full rounded-xl bg-slate-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
              <div className="h-5 w-3/4 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="pt-3 flex items-center justify-between">
              <div className="h-6 w-20 rounded bg-slate-200 animate-pulse" />
              <div className="h-10 w-24 rounded-xl bg-slate-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';
  const initialCategoryName = searchParams?.get('category') || '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  // Filtros de catálogo
  const [searchName, setSearchName] = useState(initialQuery);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState('');
  const [volumeFilter, setVolumeFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterError, setFilterError] = useState('');

  const loadCategories = async () => {
    try {
      const res = await api.getPaginated<Category[]>('/categories?limit=50');
      setCategories(res.data || []);
    } catch {
      // Fallback silencioso
    }
  };

  const fetchProducts = async (overrideParams?: {
    name?: string;
    category_id?: string;
    brand?: string;
    volume_ml?: string;
    min_price?: string;
    max_price?: string;
  }) => {
    setFilterError('');
    const nameVal = overrideParams ? overrideParams.name ?? '' : searchName;
    const catVal = overrideParams ? overrideParams.category_id ?? '' : selectedCategoryId;
    const brandVal = overrideParams ? overrideParams.brand ?? '' : brandFilter;
    const volVal = overrideParams ? overrideParams.volume_ml ?? '' : volumeFilter;
    const minVal = overrideParams ? overrideParams.min_price ?? '' : minPrice;
    const maxVal = overrideParams ? overrideParams.max_price ?? '' : maxPrice;

    const minNum = minVal ? parseFloat(minVal.replace(',', '.')) : NaN;
    const maxNum = maxVal ? parseFloat(maxVal.replace(',', '.')) : NaN;

    if (!isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
      setFilterError('O preço mínimo não pode ser maior que o preço máximo.');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (nameVal.trim()) params.set('name', nameVal.trim());
      if (catVal) params.set('category_id', catVal);
      if (brandVal.trim()) params.set('brand', brandVal.trim());
      if (volVal && Number(volVal) > 0) params.set('volume_ml', String(Number(volVal)));
      if (!isNaN(minNum) && minNum >= 0) params.set('min_price', minNum.toFixed(2));
      if (!isNaN(maxNum) && maxNum >= 0) params.set('max_price', maxNum.toFixed(2));

      const prodRes = await api.getPaginated<Product[]>(`/products?${params.toString()}`);
      setProducts(prodRes.data || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao consultar catálogo.';
      setFilterError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchName(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (initialCategoryName && categories.length > 0) {
      const matched = categories.find(
        (c) => c.name.toLowerCase() === initialCategoryName.toLowerCase(),
      );
      if (matched) {
        setSelectedCategoryId(String(matched.id));
      }
    }
  }, [initialCategoryName, categories]);

  useEffect(() => {
    void fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchName, selectedCategoryId]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchProducts();
  };

  const handleClearFilters = () => {
    setSearchName('');
    setSelectedCategoryId('');
    setBrandFilter('');
    setVolumeFilter('');
    setMinPrice('');
    setMaxPrice('');
    setFilterError('');
    void fetchProducts({
      name: '',
      category_id: '',
      brand: '',
      volume_ml: '',
      min_price: '',
      max_price: '',
    });
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock_quantity <= 0 || product.in_stock === false) {
      toast.error('Este produto está esgotado no momento.');
      return;
    }
    addItem(product, 1);
    toast.success(`${product.name} adicionado à sacola!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      {/* Hero Banner Clean */}
      <section className="bg-gradient-to-b from-teal-900 via-teal-950 to-slate-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/80 border border-teal-600/40 text-teal-200 text-xs font-semibold uppercase tracking-wider">
              <GlassWater size={14} className="text-amber-400" />
              <span>Bebidas Não Alcoólicas</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Adega Express - Bebidas sem álcool, entregues rápido.
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Águas minerais de fonte, sucos 100% integrais, refrigerantes e infusões de chá prontas para sua casa, reuniões ou eventos.
            </p>

            {/* Quick Category Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId('');
                  document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategoryId === ''
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-teal-900/80 text-teal-100 hover:bg-teal-800 border border-teal-700/50'
                }`}
              >
                Todas as Coleções
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(String(cat.id));
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCategoryId === String(cat.id)
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-teal-900/80 text-teal-100 hover:bg-teal-800 border border-teal-700/50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right Highlight Card */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Destaque do Catálogo
              </span>
              <span className="text-[11px] font-semibold text-teal-200">Em Estoque</span>
            </div>
            <div className="flex items-center gap-4">
              <ProductArtwork
                name="Suco Integral de Uva Tinto 1L"
                brand="Aurora"
                categoryName="Sucos"
                volumeMl={1000}
                size="sm"
                className="h-28 w-24 rounded-xl bg-white/5 border border-white/10 shrink-0"
              />
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-white leading-snug">
                  Suco Integral de Uva Tinto 1L
                </h3>
                <p className="text-xs text-slate-300">
                  100% uva selecionada prensada, sem adição de açúcar e sem conservantes.
                </p>
                <div className="pt-1 text-base font-extrabold text-amber-300">R$ 16,90</div>
              </div>
            </div>
            <a
              href="#catalogo"
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs tracking-wide transition-all"
            >
              <span>Ver no Catálogo</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                <Truck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Entrega Expressa</p>
                <p className="text-[11px] text-slate-500">Taxa fixa de R$ 7,90</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                <PackageCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Estoque em Tempo Real</p>
                <p className="text-[11px] text-slate-500">Reserva automática</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                <CreditCard size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Checkout Demonstrativo</p>
                <p className="text-[11px] text-slate-500">PIX ou Cartão sem custo</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Origem Garantida</p>
                <p className="text-[11px] text-slate-500">4 categorias selecionadas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
        {/* Filter Console */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
                <Filter size={16} />
                <span>Filtrar Catálogo de Bebidas</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Filtre por categoria, nome, marca, volume ou faixa de preço.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto h-9 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw size={13} className="text-slate-500" />
              <span>Limpar Filtros</span>
            </button>
          </div>

          <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Nome do Produto
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Ex.: Água, Suco..."
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Categoria
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
              >
                <option value="">Todas as Categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Marca
              </label>
              <input
                type="text"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                placeholder="Ex.: Minalba, Aurora..."
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Volume (mL)
              </label>
              <select
                value={volumeFilter}
                onChange={(e) => setVolumeFilter(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
              >
                <option value="">Qualquer volume</option>
                <option value="350">350 mL (Lata)</option>
                <option value="450">450 mL</option>
                <option value="500">500 mL (Garrafa)</option>
                <option value="900">900 mL</option>
                <option value="1000">1000 mL (1L)</option>
                <option value="1500">1500 mL (1,5L)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preço Mín
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0,00"
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preço Máx
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="50,00"
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full h-10 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Aplicar Filtros
              </button>
            </div>
          </form>

          {filterError && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-xs text-red-700 font-medium">
              <AlertCircle size={15} />
              <span>{filterError}</span>
            </div>
          )}
        </section>

        {/* Product Grid */}
        {loading ? (
          <CatalogSkeleton />
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <GlassWater size={36} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Nenhum produto encontrado para os critérios selecionados.
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tente limpar os filtros de preço ou buscar por outra categoria.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="mt-4 inline-flex items-center justify-center h-10 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Ver Todos os Produtos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const isOutOfStock = product.stock_quantity <= 0 || product.in_stock === false;

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all p-4 flex flex-col justify-between"
                >
                  <Link href={`/produto/${product.id}`} className="block">
                    {/* Artwork Container */}
                    <div className="relative h-48 w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-3.5 group-hover:bg-slate-100/60 transition-colors">
                      <ProductArtwork
                        name={product.name}
                        brand={product.brand}
                        categoryName={product.category?.name}
                        volumeMl={product.volume_ml}
                        imageUrl={product.image_url}
                        size="md"
                        className="h-full w-full"
                      />

                      {/* Out of Stock Ribbon / Badge */}
                      {isOutOfStock && (
                        <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                          Em Falta
                        </div>
                      )}
                    </div>

                    {/* Product Meta */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>{product.brand}</span>
                        <span>{product.volume_ml} ml</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {product.description || 'Bebida não alcoólica refrescante de qualidade selecionada.'}
                      </p>
                    </div>
                  </Link>

                  {/* Price & Action Button */}
                  <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block leading-none">
                        Preço
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        R$ {Number(product.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={(e) => handleAddToCart(product, e)}
                      className={`h-9 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                      }`}
                    >
                      <ShoppingBag size={14} />
                      <span>{isOutOfStock ? 'Esgotado' : 'Adicionar'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FAQ / Info Section */}
      <section id="ajuda" className="bg-slate-100/70 border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">Dúvidas Frequentes</h2>
            <p className="text-xs text-slate-500">Tudo o que você precisa saber sobre compras na Adega Express.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-xs text-slate-900 mb-1">Como funciona o pagamento demonstrativo?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Este e-commerce é um ambiente demonstrativo. Nenhum valor real é debitado do seu cartão ou conta PIX.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-xs text-slate-900 mb-1">Qual o prazo de confirmação do pedido?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pedidos sem confirmação em até 30 minutos são automaticamente cancelados com reposição do estoque.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-xs text-slate-900 mb-1">Posso comprar produtos marcados como &quot;Em Falta&quot;?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Produtos com saldo zero exibem o selo &quot;Em Falta&quot; e não podem ser adicionados à sacola até reposição.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-xs text-slate-900 mb-1">Qual é o valor do frete?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Trabalhamos com taxa de entrega fixa de R$ 7,90 por pedido para as regiões atendidas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
