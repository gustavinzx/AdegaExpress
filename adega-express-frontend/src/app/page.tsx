'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProductArtwork from '@/components/ProductArtwork';
import { api } from '@/lib/api';
import { Product, Category } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { RotateCcw } from 'lucide-react';
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
      // Categories fallback
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
      toast.success(`${product.name} adicionado!`);
    }
  };

  const categoriesToDisplay = categories.filter((cat) =>
    products.some((p) => p.category_id === cat.id),
  );

  return (
    <div className="bg-zinc-950 min-h-screen flex flex-col text-white font-sans">
      <Navbar />

      {/* HERO SECTION - Vintage Banner */}
      <section
        className="relative bg-black flex items-center bg-[url('/hero-new-bg.jpg')] bg-cover bg-center border-b border-zinc-800"
        style={{ minHeight: '500px' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-16 md:py-24">
          <div className="max-w-xl text-white">
            <h1 className="text-5xl md:text-7xl font-serif font-black leading-[1.05] mb-5 drop-shadow-lg uppercase">
              Adega <br />
              <span className="text-amber-500">Express</span>
            </h1>
            <p className="text-zinc-200 text-sm md:text-base mb-8 leading-relaxed drop-shadow">
              Águas minerais, sucos integrais, refrigerantes e chás gelados para o dia a dia,
              reuniões em família e eventos.
            </p>
            <a
              href="#catalogo"
              className="inline-block bg-amber-600 hover:bg-amber-500 text-black uppercase text-xs font-black tracking-widest py-3.5 px-8 rounded transition-colors shadow-lg"
            >
              Ver Catálogo
            </a>
          </div>
        </div>
      </section>

      {/* CATALOG SECTION */}
      <main id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex-grow w-full">
        {/* Clean Filter Bar */}
        <section className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 mb-14">
          <form
            onSubmit={handleApplyFilters}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
          >
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Produto
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Nome da bebida..."
                className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Categoria
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Marca
              </label>
              <input
                type="text"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                placeholder="Ex.: Minalba, Coca-Cola..."
                className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Volume
              </label>
              <select
                value={volumeFilter}
                onChange={(e) => setVolumeFilter(e.target.value)}
                className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Todos</option>
                <option value="290">290 mL</option>
                <option value="300">300 mL</option>
                <option value="350">350 mL</option>
                <option value="450">450 mL</option>
                <option value="500">500 mL</option>
                <option value="1000">1 Litro</option>
                <option value="1500">1,5 Litro</option>
                <option value="2000">2 Litros</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Mín (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Máx (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="50"
                  className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 h-10 bg-amber-600 hover:bg-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                title="Limpar filtros"
                className="h-10 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </form>

          {filterError && (
            <div className="mt-3 rounded-lg bg-red-950/60 border border-red-700/50 px-3.5 py-2 text-xs text-red-200">
              {filterError}
            </div>
          )}
        </section>

        {/* Products by Category */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="h-80 rounded-lg bg-zinc-900 border border-zinc-800 animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/60 rounded-xl border border-zinc-800">
            <p className="text-lg font-bold text-white mb-2">Nenhum produto encontrado.</p>
            <button
              onClick={handleClearFilters}
              className="mt-3 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded cursor-pointer"
            >
              Ver Todos os Produtos
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {categoriesToDisplay.map((category) => {
              const catProducts = products.filter((p) => p.category_id === category.id);
              if (catProducts.length === 0) return null;

              return (
                <div key={category.id}>
                  {/* Classic Vintage Category Divider */}
                  <div className="mb-8 flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-600/50" />
                    <h2 className="text-3xl md:text-4xl font-serif font-black text-white uppercase tracking-widest px-4">
                      {category.name}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-600/50" />
                  </div>

                  {/* Product Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {catProducts.map((product) => {
                      const outOfStock = !product.in_stock || product.stock_quantity <= 0;

                      return (
                        <div
                          key={product.id}
                          className={`border rounded-lg transition-all duration-300 flex flex-col bg-zinc-900 group overflow-hidden shadow-xl ${
                            outOfStock
                              ? 'border-zinc-800 opacity-75'
                              : 'border-zinc-800 hover:border-amber-500 hover:-translate-y-1'
                          }`}
                        >
                          {/* Image Area */}
                          <Link
                            href={`/produto/${product.id}`}
                            className="p-4 flex justify-center items-center h-52 bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800 relative overflow-hidden"
                          >
                            {outOfStock && (
                              <span className="absolute top-2.5 right-2.5 z-10 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                                Em Falta
                              </span>
                            )}
                            <ProductArtwork
                              name={product.name}
                              brand={product.brand}
                              categoryName={category.name}
                              volumeMl={product.volume_ml}
                              imageUrl={product.image_url}
                              className="w-full h-full"
                            />
                          </Link>

                          {/* Content */}
                          <div className="p-4 flex-1 flex flex-col">
                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1">
                              {product.brand}
                            </p>
                            <Link
                              href={`/produto/${product.id}`}
                              className="font-bold text-white text-sm leading-snug mb-3 line-clamp-2 hover:text-amber-500 transition-colors"
                            >
                              {product.name}
                            </Link>

                            <div className="mt-auto bg-black/40 rounded py-2 px-3 text-center border border-zinc-800">
                              <span className="font-black text-amber-500 text-lg">
                                R$ {parseFloat(product.price).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </div>

                          {/* Add Button */}
                          <button
                            type="button"
                            disabled={outOfStock}
                            onClick={() => handleQuickAdd(product)}
                            className={`w-full py-3.5 text-[11px] font-black tracking-widest uppercase border-t border-zinc-800 transition-colors ${
                              outOfStock
                                ? 'bg-zinc-950 text-zinc-600 cursor-not-allowed'
                                : 'bg-zinc-950 text-zinc-300 hover:bg-amber-600 hover:text-black cursor-pointer'
                            }`}
                          >
                            {outOfStock ? 'Em Falta' : 'Adicionar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Simple Help Section */}
        <section
          id="ajuda"
          className="mt-20 bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 sm:p-8"
        >
          <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wider mb-6 border-b border-zinc-800 pb-3">
            Dúvidas Frequentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-400 leading-relaxed">
            <div>
              <h3 className="font-bold text-white uppercase mb-1">Catálogo de Bebidas</h3>
              <p>
                Trabalhamos exclusivamente com bebidas não alcoólicas: águas, sucos, refrigerantes
                e chás prontos para consumo.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white uppercase mb-1">Como funciona o pagamento?</h3>
              <p>
                Você escolhe entre PIX ou Cartão no fechamento do pedido em caráter demonstrativo
                (sem cobrança real). A confirmação é feita pela equipe da loja.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white uppercase mb-1">Reserva e Prazo</h3>
              <p>
                O estoque é reservado ao finalizar o pedido. Caso o pagamento não seja confirmado em
                até 30 minutos, o pedido é cancelado automaticamente.
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
        <div className="min-h-screen bg-zinc-950 text-amber-500 flex items-center justify-center font-bold uppercase tracking-widest text-xs">
          Carregando...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
