'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  HelpCircle,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  GlassWater,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

function CatalogSkeleton() {
  return (
    <div className="space-y-14">
      <div className="flex items-center justify-between border-b border-[#c9a256]/15 pb-4">
        <div className="h-8 w-48 rounded-lg bg-[#1c1814] animate-pulse" />
        <div className="h-5 w-24 rounded-full bg-[#1c1814] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[#c9a256]/12 bg-[#14110e] p-5 space-y-4"
          >
            <div className="h-56 w-full rounded-xl bg-[#1c1814] animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-[#1c1814] animate-pulse" />
              <div className="h-5 w-3/4 rounded bg-[#1c1814] animate-pulse" />
            </div>
            <div className="pt-3 flex items-center justify-between">
              <div className="h-7 w-24 rounded bg-[#1c1814] animate-pulse" />
              <div className="h-11 w-28 rounded-full bg-[#1c1814] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get('q') || '';
  const initialCategoryName = searchParams?.get('category') || '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  // Filter states (RF01 / UC04)
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
      // Categories fallback if backend is starting
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

    if (minVal && maxVal && Number(minVal) > Number(maxVal)) {
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
      if (minVal && Number(minVal) >= 0) params.set('min_price', Number(minVal).toFixed(2));
      if (maxVal && Number(maxVal) >= 0) params.set('max_price', Number(maxVal).toFixed(2));

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
    const syncQuery = async () => {
      await Promise.resolve();
      setSearchName(initialQuery);
    };
    void syncQuery();
  }, [initialQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories();
  }, []);

  useEffect(() => {
    const syncCategory = async () => {
      if (initialCategoryName && categories.length > 0) {
        const matched = categories.find(
          (c) => c.name.toLowerCase() === initialCategoryName.toLowerCase(),
        );
        if (matched) {
          await Promise.resolve();
          setSelectedCategoryId(String(matched.id));
        }
      }
    };
    void syncCategory();
  }, [initialCategoryName, categories]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    router.push('/#catalogo');
    void fetchProducts({
      name: '',
      category_id: '',
      brand: '',
      volume_ml: '',
      min_price: '',
      max_price: '',
    });
  };

  const handleQuickAdd = (product: Product) => {
    const added = addItem(product, 1);
    if (added) {
      toast.success(`${product.name} adicionado à sacola!`);
    }
  };

  const categoriesToDisplay = categories.filter((cat) =>
    products.some((p) => p.category_id === cat.id),
  );

  return (
    <div className="bg-[#0e0c0a] min-h-screen flex flex-col text-[#f4efe6] font-sans">
      <Navbar />

      {/* Editorial Asymmetric Hero Section */}
      <section className="relative overflow-hidden border-b border-[#c9a256]/15 pt-10 pb-20 lg:pt-16 lg:pb-24">
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-[#c9a256]/8 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-10 h-80 w-80 rounded-full bg-amber-700/8 blur-[110px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Focal Point (7 cols) */}
            <div className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#c9a256]/30 bg-[#161310] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#c9a256]">
                <Sparkles size={13} />
                <span>Curadoria Botânica &amp; Mineral • 100% Sem Álcool</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-[68px] font-semibold text-[#f4efe6] leading-[1.04] tracking-[-0.02em]">
                A arte de servir{' '}
                <span className="italic font-normal text-[#c9a256]">frescor puro</span> em cada
                ocasião.
              </h1>

              <p className="text-base sm:text-lg text-[#9e9589] max-w-xl leading-relaxed">
                De águas minerais de fontes naturais a sucos 100% prensados, refrigerantes
                clássicos e infusões de chá gelado. Seleção pensada para a mesa da família,
                recepções e eventos.
              </p>

              {/* Quick Category Pills */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('');
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`h-11 px-5 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer ${
                    selectedCategoryId === ''
                      ? 'bg-[#c9a256] text-[#0e0c0a] shadow-[0_4px_20px_rgba(201,162,86,0.3)]'
                      : 'bg-[#161310] text-[#f4efe6] border border-[#c9a256]/20 hover:border-[#c9a256]'
                  }`}
                >
                  Toda a Coleção
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(String(cat.id));
                      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`h-11 px-5 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer ${
                      selectedCategoryId === String(cat.id)
                        ? 'bg-[#c9a256] text-[#0e0c0a] shadow-[0_4px_20px_rgba(201,162,86,0.3)]'
                        : 'bg-[#161310] text-[#f4efe6]/85 border border-[#c9a256]/20 hover:border-[#c9a256]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Asymmetric Bento Showcase (5 cols) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="col-span-2 rounded-3xl border border-[#c9a256]/25 bg-gradient-to-br from-[#1b1612] via-[#14110e] to-[#0e0c0a] p-6 flex items-center justify-between gap-4 shadow-2xl">
                <div className="space-y-2 max-w-[58%]">
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#c9a256]">
                    Destaque da Estação
                  </span>
                  <h2 className="font-serif text-2xl font-semibold text-[#f4efe6] leading-tight">
                    Suco Integral de Uva Tinto 1L
                  </h2>
                  <p className="text-xs text-[#9e9589] leading-relaxed">
                    100% uva prensada sem adição de açúcares ou conservantes.
                  </p>
                  <a
                    href="#catalogo"
                    className="inline-flex items-center gap-1.5 pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c9a256] hover:text-[#e0be74]"
                  >
                    <span>Ver na vitrine</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
                <div className="shrink-0 group">
                  <ProductArtwork
                    name="Suco Integral de Uva Tinto 1L"
                    brand="Aurora"
                    categoryName="Sucos"
                    volumeMl={1000}
                    size="sm"
                    className="h-36 w-28 rounded-2xl border border-[#c9a256]/15 bg-[#120f0c]"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-[#c9a256]/15 bg-[#14110e] p-5 space-y-2">
                <div className="h-9 w-9 rounded-full bg-[#c9a256]/15 text-[#c9a256] flex items-center justify-center">
                  <GlassWater size={17} />
                </div>
                <p className="font-serif text-xl font-semibold text-[#f4efe6]">4 Coleções</p>
                <p className="text-xs text-[#9e9589] leading-relaxed">
                  Água, Sucos, Refrigerantes e Chás selecionados.
                </p>
              </div>

              <div className="rounded-3xl border border-[#c9a256]/15 bg-[#14110e] p-5 space-y-2">
                <div className="h-9 w-9 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={17} />
                </div>
                <p className="font-serif text-xl font-semibold text-[#f4efe6]">Estoque Real</p>
                <p className="text-xs text-[#9e9589] leading-relaxed">
                  Reserva imediata no pedido e transparência total.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Pillars Ribbon */}
      <section className="bg-[#120f0c] border-b border-[#c9a256]/12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#1b1612] border border-[#c9a256]/20 flex items-center justify-center text-[#c9a256] shrink-0">
                <PackageCheck size={18} />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f4efe6]">
                  Reserva Atômica (RN01)
                </h3>
                <p className="text-xs text-[#9e9589] mt-0.5">
                  Baixa automática de estoque no instante do pedido.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#1b1612] border border-[#c9a256]/20 flex items-center justify-center text-[#c9a256] shrink-0">
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f4efe6]">
                  Checkout Demonstrativo
                </h3>
                <p className="text-xs text-[#9e9589] mt-0.5">
                  PIX ou Cartão sem cobrança bancária real (RF07).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#1b1612] border border-[#c9a256]/20 flex items-center justify-center text-[#c9a256] shrink-0">
                <Truck size={18} />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f4efe6]">
                  Logística Sincronizada
                </h3>
                <p className="text-xs text-[#9e9589] mt-0.5">
                  Acompanhe cada etapa de preparo até a entrega.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-[#1b1612] border border-[#c9a256]/20 flex items-center justify-center text-[#c9a256] shrink-0">
                <Check size={18} />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f4efe6]">
                  Eventos &amp; Casa (RF17)
                </h3>
                <p className="text-xs text-[#9e9589] mt-0.5">
                  Unidades avulsas ou fardos para recepções.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog & Filter Console */}
      <main id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-grow w-full">
        {/* Refined Filter Console (RF01 / UC04) */}
        <section className="rounded-3xl border border-[#c9a256]/20 bg-[#14110e] p-6 sm:p-8 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-[#c9a256]/12">
            <div>
              <div className="flex items-center gap-2 text-[#c9a256] text-xs font-semibold uppercase tracking-[0.18em]">
                <Filter size={14} />
                <span>Sommelier de Busca &amp; Filtros</span>
              </div>
              <p className="text-xs text-[#9e9589] mt-1">
                Refine por categoria, nome, marca, volume em mililitros ou faixa de preço (RF01).
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 self-start sm:self-auto h-10 px-4 rounded-full border border-[#c9a256]/20 bg-[#1a1612] hover:border-[#c9a256] text-xs font-medium text-[#f4efe6] transition-all cursor-pointer"
            >
              <RotateCcw size={13} className="text-[#c9a256]" />
              <span>Limpar Filtros</span>
            </button>
          </div>

          <form
            onSubmit={handleApplyFilters}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4"
          >
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                Bebida
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Ex.: Água, Uva, Mate..."
                className="w-full h-11 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-3.5 text-xs text-[#f4efe6] placeholder-[#9e9589]/50 focus:outline-none focus:border-[#c9a256]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                Coleção
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full h-11 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-3 text-xs text-[#f4efe6] focus:outline-none focus:border-[#c9a256]"
              >
                <option value="">Todas as Coleções</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                Marca
              </label>
              <input
                type="text"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                placeholder="Ex.: Minalba, Aurora..."
                className="w-full h-11 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-3.5 text-xs text-[#f4efe6] placeholder-[#9e9589]/50 focus:outline-none focus:border-[#c9a256]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                Volume (mL)
              </label>
              <select
                value={volumeFilter}
                onChange={(e) => setVolumeFilter(e.target.value)}
                className="w-full h-11 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-3 text-xs text-[#f4efe6] focus:outline-none focus:border-[#c9a256]"
              >
                <option value="">Qualquer volume</option>
                <option value="290">290 mL</option>
                <option value="300">300 mL</option>
                <option value="350">350 mL</option>
                <option value="450">450 mL</option>
                <option value="500">500 mL</option>
                <option value="1000">1000 mL (1L)</option>
                <option value="1500">1500 mL (1,5L)</option>
                <option value="2000">2000 mL (2L)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                  Mín (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0,00"
                  className="w-full h-11 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-2.5 text-xs text-[#f4efe6] placeholder-[#9e9589]/50 focus:outline-none focus:border-[#c9a256]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                  Máx (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="50,00"
                  className="w-full h-11 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-2.5 text-xs text-[#f4efe6] placeholder-[#9e9589]/50 focus:outline-none focus:border-[#c9a256]"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full h-11 bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.16em] rounded-xl transition-all cursor-pointer shadow-[0_4px_20px_rgba(201,162,86,0.25)]"
              >
                Filtrar Vitrine
              </button>
            </div>
          </form>

          {filterError && (
            <div className="mt-4 rounded-xl bg-red-950/50 border border-red-500/40 px-4 py-3 text-xs text-red-200">
              {filterError}
            </div>
          )}
        </section>

        {/* Catalog Grid */}
        {loading ? (
          <CatalogSkeleton />
        ) : products.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-[#c9a256]/15 bg-[#14110e] px-6">
            <p className="font-serif text-3xl text-[#f4efe6] mb-2">
              Nenhuma bebida encontrada para esta seleção
            </p>
            <p className="text-sm text-[#9e9589] mb-8 max-w-md mx-auto">
              Experimente limpar os filtros ou explorar todas as nossas coleções de águas, sucos
              integrais, refrigerantes e chás.
            </p>
            <button
              onClick={handleClearFilters}
              className="h-11 px-7 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.16em] transition-all cursor-pointer"
            >
              Restaurar Vitrine Completa
            </button>
          </div>
        ) : (
          <div className="space-y-20">
            {categoriesToDisplay.map((category) => {
              const catProducts = products.filter((p) => p.category_id === category.id);
              if (catProducts.length === 0) return null;

              return (
                <section key={category.id} className="space-y-8">
                  {/* Editorial Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#c9a256]/15 pb-5">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#c9a256]">
                        Coleção Selecionada
                      </span>
                      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#f4efe6] mt-1">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-xs text-[#9e9589] mt-1">{category.description}</p>
                      )}
                    </div>
                    <span className="text-xs font-mono text-[#9e9589]">
                      {catProducts.length}{' '}
                      {catProducts.length === 1 ? 'rótulo disponível' : 'rótulos disponíveis'}
                    </span>
                  </div>

                  {/* Product Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {catProducts.map((product) => {
                      const outOfStock = !product.in_stock || product.stock_quantity <= 0;

                      return (
                        <article
                          key={product.id}
                          className={`group relative rounded-3xl border transition-all duration-500 flex flex-col overflow-hidden ${
                            outOfStock
                              ? 'border-red-900/30 bg-[#12100e]/80 opacity-85'
                              : 'border-[#c9a256]/15 hover:border-[#c9a256]/55 bg-[#14110e] hover:shadow-[0_20px_45px_rgba(0,0,0,0.65)]'
                          }`}
                        >
                          {/* Top Badges */}
                          <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
                            <span className="rounded-full bg-[#0e0c0a]/85 backdrop-blur-md border border-[#c9a256]/25 px-3 py-1 text-[10px] font-mono font-semibold text-[#f4efe6]">
                              {product.volume_ml >= 1000
                                ? `${(product.volume_ml / 1000).toString().replace('.', ',')}L`
                                : `${product.volume_ml} mL`}
                            </span>

                            {outOfStock ? (
                              <span className="rounded-full bg-red-950/95 border border-red-500/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-200">
                                Em Falta
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-950/85 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-mono text-emerald-300">
                                {product.stock_quantity} un.
                              </span>
                            )}
                          </div>

                          {/* Studio Bottle/Can Visual */}
                          <Link
                            href={`/produto/${product.id}`}
                            className="relative h-64 w-full border-b border-[#c9a256]/10 bg-gradient-to-b from-[#1b1612] to-[#120f0c] p-6 flex items-center justify-center"
                          >
                            <ProductArtwork
                              name={product.name}
                              brand={product.brand}
                              categoryName={category.name}
                              volumeMl={product.volume_ml}
                              imageUrl={product.image_url}
                              className="w-full h-full"
                            />
                          </Link>

                          {/* Card Info */}
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
                            <div>
                              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a256]">
                                {product.brand}
                              </span>
                              <Link href={`/produto/${product.id}`}>
                                <h3 className="font-serif text-xl font-semibold text-[#f4efe6] group-hover:text-[#c9a256] transition-colors line-clamp-2 mt-1 leading-snug">
                                  {product.name}
                                </h3>
                              </Link>
                              {product.description && (
                                <p className="text-xs text-[#9e9589] line-clamp-2 mt-2 leading-relaxed">
                                  {product.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-[#c9a256]/10 flex items-center justify-between gap-3">
                              <div>
                                <span className="block text-[10px] uppercase tracking-wider text-[#9e9589]">
                                  Valor Unitário
                                </span>
                                <span className="font-mono text-lg font-semibold text-[#f4efe6]">
                                  R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                                </span>
                              </div>

                              <button
                                type="button"
                                disabled={outOfStock}
                                onClick={() => handleQuickAdd(product)}
                                className={`h-11 px-4 rounded-full text-xs font-semibold uppercase tracking-[0.12em] flex items-center gap-2 transition-all ${
                                  outOfStock
                                    ? 'bg-[#1f1b18] text-[#9e9589]/50 cursor-not-allowed border border-white/5'
                                    : 'bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] cursor-pointer shadow-[0_4px_15px_rgba(201,162,86,0.2)]'
                                }`}
                              >
                                <ShoppingBag size={14} />
                                <span>{outOfStock ? 'Indisponível' : 'Adicionar'}</span>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Section 8.3: Editorial Bento Help & FAQ (#ajuda) */}
        <section
          id="ajuda"
          className="mt-28 rounded-3xl border border-[#c9a256]/20 bg-gradient-to-br from-[#161310] to-[#110e0c] p-8 sm:p-12"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-[#c9a256]/15">
            <div>
              <div className="inline-flex items-center gap-2 text-[#c9a256] text-xs font-semibold uppercase tracking-[0.2em]">
                <HelpCircle size={15} />
                <span>Concierge &amp; Guia do Cliente</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#f4efe6] mt-2">
                Como funciona a experiência Adega Express
              </h2>
            </div>
            <span className="text-xs font-mono text-[#9e9589]">
              Regras Operacionais • Documento de Visão v4.3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div className="rounded-2xl border border-[#c9a256]/12 bg-[#0e0c0a]/70 p-6 space-y-2.5">
              <span className="font-mono text-xs text-[#c9a256]">01 / ESCOPO</span>
              <h3 className="font-serif text-xl font-semibold text-[#f4efe6]">
                Exclusivamente Não Alcoólico
              </h3>
              <p className="text-xs text-[#9e9589] leading-relaxed">
                Comercializamos exclusivamente bebidas não alcoólicas organizadas em 4 coleções:
                <strong> Água</strong>, <strong>Sucos</strong>, <strong>Refrigerantes</strong> e{' '}
                <strong>Chás</strong>. Não há exigência de maioridade.
              </p>
            </div>

            <div className="rounded-2xl border border-[#c9a256]/12 bg-[#0e0c0a]/70 p-6 space-y-2.5">
              <span className="font-mono text-xs text-[#c9a256]">02 / CHECKOUT</span>
              <h3 className="font-serif text-xl font-semibold text-[#f4efe6]">
                Pagamento Demonstrativo (RF07)
              </h3>
              <p className="text-xs text-[#9e9589] leading-relaxed">
                Você escolhe entre <strong>PIX</strong> ou <strong>Cartão</strong> apenas como
                registro demonstrativo no pedido. Nenhuma cobrança bancária real ou geração de QR
                Code é realizada.
              </p>
            </div>

            <div className="rounded-2xl border border-[#c9a256]/12 bg-[#0e0c0a]/70 p-6 space-y-2.5">
              <span className="font-mono text-xs text-[#c9a256]">03 / RESERVA &amp; PRAZO</span>
              <h3 className="font-serif text-xl font-semibold text-[#f4efe6]">
                Reserva e Expiração em 30 Min (RN07)
              </h3>
              <p className="text-xs text-[#9e9589] leading-relaxed">
                O estoque é reservado ao criar o pedido. Caso o pagamento demonstrativo não seja
                confirmado pela equipe em até <strong>30 minutos</strong>, o pedido é cancelado e o
                estoque retorna automaticamente.
              </p>
            </div>

            <div className="rounded-2xl border border-[#c9a256]/12 bg-[#0e0c0a]/70 p-6 space-y-2.5">
              <span className="font-mono text-xs text-[#c9a256]">04 / DISPONIBILIDADE</span>
              <h3 className="font-serif text-xl font-semibold text-[#f4efe6]">
                Rótulos Em Falta (RF02 / RN03)
              </h3>
              <p className="text-xs text-[#9e9589] leading-relaxed">
                Produtos com saldo zero permanecem visíveis na vitrine com o selo{' '}
                <strong>Em Falta</strong> para transparência do catálogo, mas ficam bloqueados para
                adição à sacola.
              </p>
            </div>

            <div className="rounded-2xl border border-[#c9a256]/12 bg-[#0e0c0a]/70 p-6 space-y-2.5">
              <span className="font-mono text-xs text-[#c9a256]">05 / RECEPÇÕES</span>
              <h3 className="font-serif text-xl font-semibold text-[#f4efe6]">
                Compras para Eventos (RF17)
              </h3>
              <p className="text-xs text-[#9e9589] leading-relaxed">
                Na página de cada bebida ou direto na sacola você pode definir quantidades maiores
                para festas e reuniões familiares, sempre respeitando o saldo em estoque.
              </p>
            </div>

            <div className="rounded-2xl border border-[#c9a256]/12 bg-[#0e0c0a]/70 p-6 space-y-2.5">
              <span className="font-mono text-xs text-[#c9a256]">06 / LOGÍSTICA</span>
              <h3 className="font-serif text-xl font-semibold text-[#f4efe6]">
                5 Etapas até a Entrega (RN04)
              </h3>
              <p className="text-xs text-[#9e9589] leading-relaxed">
                Acompanhe em <em>Meus Pedidos</em> a evolução completa:{' '}
                <strong>Pendente → Confirmado → Separado → Em Rota → Entregue</strong>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0e0c0a] text-[#c9a256] flex items-center justify-center font-serif text-2xl">
          Preparando a vitrine...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
