'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
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
  Droplets,
  HelpCircle,
  Sparkles,
  ShoppingCart,
} from 'lucide-react';
import toast from 'react-hot-toast';

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

  // Agrupar produtos por categoria
  const groupedProducts = products.reduce(
    (acc, product) => {
      const cat = product.category?.name || 'Bebidas Não Alcoólicas';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    },
    {} as Record<string, Product[]>,
  );

  return (
    <>
      <Navbar />
      <main className="bg-zinc-950 min-h-screen font-sans">
        {/* HERO SECTION */}
        <section className="relative bg-zinc-950 border-b border-zinc-800 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,119,6,0.16),_transparent_65%)] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-5">
                <Sparkles size={13} /> Catálogo 100% Não Alcoólico • Pronta Entrega
              </span>
              <h1 className="text-4xl md:text-6xl font-serif font-black leading-tight text-white mb-5">
                REFRESCÂNCIA &{' '}
                <span className="text-amber-500">QUALIDADE</span> PARA O SEU DIA E EVENTOS
              </h1>
              <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-8 max-w-xl">
                Distribuidora online especializada exclusivamente em bebidas não alcoólicas:{' '}
                <strong className="text-white">Água, Sucos, Refrigerantes e Chás</strong>. Estoque
                em tempo real, suporte a compras para eventos e acompanhamento completo do pedido.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#catalogo"
                  className="bg-amber-600 text-black uppercase text-xs font-black tracking-widest py-3.5 px-7 rounded hover:bg-amber-500 transition-colors shadow-lg"
                >
                  Explorar Catálogo
                </a>
                <a
                  href="#ajuda"
                  className="bg-zinc-900 border border-zinc-700 text-zinc-200 uppercase text-xs font-bold tracking-widest py-3.5 px-6 rounded hover:border-amber-500 hover:text-amber-400 transition-colors"
                >
                  Como Funciona
                </a>
              </div>
            </div>

            {/* Category Quick Pills */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-80 shrink-0">
              {[
                { name: 'Água', desc: 'Mineral natural, com gás e tônica' },
                { name: 'Sucos', desc: 'Integrais 100% fruta e néctares' },
                { name: 'Refrigerantes', desc: 'Tradicionais, zero e familiares' },
                { name: 'Chás', desc: 'Chás gelados e infusões prontas' },
              ].map((cat) => {
                const matched = categories.find((c) => c.name === cat.name);
                const isSelected = matched && String(matched.id) === selectedCategoryId;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      if (matched) {
                        setSelectedCategoryId(isSelected ? '' : String(matched.id));
                      } else {
                        setSearchName(cat.name);
                      }
                      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-600/15 border-amber-500 text-white'
                        : 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/60 text-zinc-200'
                    }`}
                  >
                    <Droplets size={18} className="text-amber-500 mb-2" />
                    <p className="font-black uppercase tracking-wider text-xs text-white">
                      {cat.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{cat.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURES BAR */}
        <section className="bg-zinc-900/70 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: PackageCheck,
                title: 'Estoque em Tempo Real',
                desc: 'Disponibilidade atualizada a cada pedido (RN01)',
              },
              {
                icon: Truck,
                title: 'Acompanhamento Online',
                desc: 'Consulte todas as etapas até a entrega (UC05)',
              },
              {
                icon: CreditCard,
                title: 'Checkout Demonstrativo',
                desc: 'Modalidades PIX ou Cartão sem cobrança real (RF07)',
              },
              {
                icon: ShieldCheck,
                title: 'Atendimento a Eventos',
                desc: 'Suporte a pedidos de maior quantidade (RF17)',
              },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-500 shrink-0">
                  <feature.icon size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="font-black uppercase tracking-wider text-white text-xs">
                    {feature.title}
                  </h2>
                  <p className="text-zinc-400 text-[11px]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CATALOG & FILTERS SECTION (UC04 / RF01 / RF02) */}
        <section id="catalogo" className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 md:p-6 mb-10 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Filter size={18} className="text-amber-500" /> Filtrar Catálogo de Bebidas
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Filtre por categoria, nome, marca, volume (ml) ou faixa de preço (RF01).
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearFilters}
                className="self-start md:self-auto inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-amber-500 transition-colors"
              >
                <RotateCcw size={14} /> Limpar Filtros
              </button>
            </div>

            <form
              onSubmit={handleApplyFilters}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
            >
              <div>
                <label
                  htmlFor="filter-name"
                  className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                >
                  Nome do Produto
                </label>
                <input
                  id="filter-name"
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Ex.: Água, Suco..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-category"
                  className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                >
                  Categoria
                </label>
                <select
                  id="filter-category"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Todas as Categorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-brand"
                  className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                >
                  Marca
                </label>
                <input
                  id="filter-brand"
                  type="text"
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  placeholder="Ex.: Minalba, Aurora..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-volume"
                  className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                >
                  Volume (ml)
                </label>
                <select
                  id="filter-volume"
                  value={volumeFilter}
                  onChange={(e) => setVolumeFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Qualquer volume</option>
                  <option value="290">290 ml</option>
                  <option value="300">300 ml</option>
                  <option value="350">350 ml</option>
                  <option value="450">450 ml</option>
                  <option value="500">500 ml</option>
                  <option value="1000">1000 ml (1L)</option>
                  <option value="1500">1500 ml (1,5L)</option>
                  <option value="2000">2000 ml (2L)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="filter-min-price"
                    className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                  >
                    Preço Mín (R$)
                  </label>
                  <input
                    id="filter-min-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="filter-max-price"
                    className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                  >
                    Preço Máx (R$)
                  </label>
                  <input
                    id="filter-max-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="50,00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest text-xs py-2.5 px-4 rounded transition-colors"
                >
                  Aplicar Filtros
                </button>
              </div>
            </form>

            {filterError && (
              <p className="mt-3 text-xs text-red-400 font-semibold bg-red-950/40 border border-red-900/50 rounded px-3 py-2">
                {filterError}
              </p>
            )}
          </div>

          {/* PRODUCT LISTING */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-80 animate-pulse flex flex-col justify-between"
                >
                  <div className="bg-zinc-800 h-40 rounded-lg" />
                  <div className="space-y-2">
                    <div className="bg-zinc-800 h-3 w-1/3 rounded" />
                    <div className="bg-zinc-800 h-4 w-3/4 rounded" />
                    <div className="bg-zinc-800 h-8 w-full rounded mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedProducts).length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/80 border border-zinc-800 rounded-xl p-8">
              <p className="text-zinc-300 font-bold text-base mb-2">
                Nenhum produto encontrado para os critérios selecionados.
              </p>
              <p className="text-zinc-500 text-xs mb-6">
                Tente limpar os filtros ou buscar por outra categoria (Água, Sucos, Refrigerantes ou Chás).
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest text-xs px-6 py-2.5 rounded transition-colors"
              >
                Ver Todos os Produtos
              </button>
            </div>
          ) : (
            Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
              <div key={categoryName} className="mb-14">
                <div className="mb-6 flex items-center gap-4">
                  <div className="h-0.5 w-8 bg-amber-500" />
                  <h2 className="text-2xl md:text-3xl font-serif font-black text-white uppercase tracking-wider">
                    {categoryName}
                  </h2>
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    ({categoryProducts.length} {categoryProducts.length === 1 ? 'item' : 'itens'})
                  </span>
                  <div className="h-0.5 flex-1 bg-zinc-800" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {categoryProducts.map((product) => {
                    const outOfStock = !product.in_stock || product.stock_quantity <= 0;
                    return (
                      <div
                        key={product.id}
                        className={`border rounded-xl transition-all duration-200 flex flex-col bg-zinc-900 overflow-hidden shadow-lg ${
                          outOfStock
                            ? 'border-zinc-800/80 opacity-85'
                            : 'border-zinc-800 hover:border-amber-500/80'
                        }`}
                      >
                        {/* Image / Visual Representation */}
                        <Link
                          href={`/produto/${product.id}`}
                          className="p-5 flex justify-center items-center h-48 bg-gradient-to-b from-zinc-800/60 to-zinc-950 border-b border-zinc-800 relative group"
                        >
                          {/* Volume Badge */}
                          <span className="absolute top-3 left-3 bg-zinc-950/90 border border-zinc-700 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded">
                            {product.volume_ml >= 1000
                              ? `${(product.volume_ml / 1000).toString().replace('.', ',')}L`
                              : `${product.volume_ml}ml`}
                          </span>

                          {/* Stock Badge (RF02 / RN03) */}
                          {outOfStock ? (
                            <span className="absolute top-3 right-3 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded">
                              Em Falta
                            </span>
                          ) : (
                            <span className="absolute top-3 right-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                              {product.stock_quantity} em estoque
                            </span>
                          )}

                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center px-3">
                              <Droplets size={36} className="text-amber-500/80 mb-2" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                                {product.brand}
                              </span>
                              <span className="text-xs font-bold text-zinc-300 line-clamp-2 mt-1">
                                {product.name}
                              </span>
                            </div>
                          )}
                        </Link>

                        {/* Product Info */}
                        <div className="p-4 flex-1 flex flex-col">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">
                              {product.brand}
                            </p>
                            <span className="text-[10px] text-zinc-400 font-semibold">
                              {product.volume_ml} ml
                            </span>
                          </div>

                          <Link
                            href={`/produto/${product.id}`}
                            className="font-bold text-white text-sm leading-snug mb-2 line-clamp-2 hover:text-amber-500 transition-colors"
                          >
                            {product.name}
                          </Link>

                          {product.description && (
                            <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                              {product.description}
                            </p>
                          )}

                          <div className="mt-auto pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                                Preço Unitário
                              </span>
                              <span className="font-black text-amber-500 text-lg">
                                R$ {Number(product.price).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                            <Link
                              href={`/produto/${product.id}`}
                              className="text-[11px] font-bold text-zinc-400 hover:text-white underline"
                            >
                              Detalhes
                            </Link>
                          </div>
                        </div>

                        {/* Action Button (RF02 / RN03) */}
                        {outOfStock ? (
                          <button
                            type="button"
                            disabled
                            aria-disabled="true"
                            className="w-full py-3.5 text-xs font-black tracking-widest uppercase bg-zinc-950 text-red-400/80 border-t border-zinc-800 cursor-not-allowed"
                          >
                            Em Falta — Indisponível
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const ok = addItem(product, 1);
                              if (ok) {
                                toast.success(`${product.name} adicionado ao carrinho!`);
                              }
                            }}
                            className="w-full py-3.5 text-xs font-black tracking-widest uppercase bg-zinc-950 text-zinc-200 hover:bg-amber-600 hover:text-black transition-colors border-t border-zinc-800 flex items-center justify-center gap-2"
                          >
                            <ShoppingCart size={14} /> Adicionar ao Carrinho
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        {/* ONLINE HELP / FAQ SECTION (Seção 8.3 do Documento de Visão) */}
        <section id="ajuda" className="border-t border-zinc-900 bg-zinc-900/40 py-14">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="text-amber-500" size={24} />
              <h2 className="text-2xl font-serif font-black text-white uppercase tracking-wider">
                Ajuda On-line & Perguntas Frequentes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 mb-2">
                  1. Quais produtos são comercializados?
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Nesta versão acadêmica (v4.3), o Adega Express opera exclusivamente com bebidas não
                  alcoólicas divididas em quatro categorias: <strong>Água, Sucos, Refrigerantes e Chás</strong>.
                  Não há venda de bebidas alcoólicas ou produtos de tabacaria.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 mb-2">
                  2. Como funciona o pagamento demonstrativo?
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  O checkout registra a modalidade escolhida (<strong>PIX ou Cartão</strong>) apenas
                  para fins demonstrativos. <strong>Nenhuma cobrança financeira real é realizada.</strong> A
                  confirmação do pagamento é feita manualmente por um Atendente ou Administrador na Mesa
                  de Operações.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 mb-2">
                  3. Qual é o prazo de confirmação do pedido?
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Ao finalizar a compra, o estoque é reservado/debitado imediatamente (RN01). Caso o
                  pagamento demonstrativo não seja confirmado pela equipe em até{' '}
                  <strong>30 minutos</strong>, o pedido é cancelado automaticamente e o estoque é
                  devolvido (RN07).
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 mb-2">
                  4. Como acompanhar meu pedido e entrega?
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Acesse <strong>Meus Pedidos</strong> no menu superior para visualizar em tempo real
                  cada etapa: <em>Pendente, Confirmado, Separado, Em Rota, Entregue ou Cancelado</em>,
                  sem precisar ligar para o atendimento.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500 font-black tracking-widest uppercase">
          Carregando catálogo...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
