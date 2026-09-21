'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { Truck, ShieldCheck, CreditCard, HeadphonesIcon, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

function HomeContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [query]);

  const fetchData = async () => {
    try {
      const prodRes = await api.getPaginated<Product[]>(`/products?limit=100${query ? `&name=${encodeURIComponent(query)}` : ''}`);
      setProducts(prodRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar produtos por categoria
  const groupedProducts = products.reduce((acc, product) => {
    const cat = product.category?.name || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Variantes para as animações
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <Navbar />
      {/* WOOD BACKGROUND ADDED HERE */}
      <main className="bg-zinc-950 min-h-screen font-sans overflow-hidden">
        
        {/* HERO SECTION - Realistic Banner */}
        <section className="relative bg-black flex items-center bg-[url('/hero-new-bg.jpg')] bg-cover bg-center" style={{ minHeight: '550px' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
          
          <div className="max-w-7xl mx-auto px-4 relative z-10 w-full py-16 md:py-24">
            <motion.div 
              className="w-full md:w-1/2 text-white"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-serif font-black leading-[1.1] mb-6 drop-shadow-lg text-white">
                MOMENTOS<br/><span className="text-amber-500">PREMIUM</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-white/90 text-sm md:text-base font-medium mb-8 max-w-md drop-shadow-md">
                Encontre as melhores marcas de bebidas, tabacaria e conveniência com os preços de distribuidora e entrega rápida na sua porta.
              </motion.p>
              <motion.div variants={fadeIn}>
                <Link href="#catalogo" className="inline-block bg-amber-600 text-white uppercase text-xs font-black tracking-widest py-3 px-8 rounded-sm hover:bg-amber-500 hover:scale-105 transition-all shadow-lg">
                  Ver Catálogo
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES BAR */}
        <section className="bg-zinc-950/90 backdrop-blur-md border-b-2 border-amber-600 shadow-2xl">
          <motion.div 
            className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {[
              { icon: Truck, title: "Entrega Rápida", desc: "Na região metropolitana" },
              { icon: ShieldCheck, title: "Garantia de Qualidade", desc: "Produtos 100% originais" },
              { icon: CreditCard, title: "Pagamento Seguro", desc: "Aceitamos Pix e Cartões" },
              { icon: HeadphonesIcon, title: "Atendimento Rápido", desc: "Suporte via WhatsApp" }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeIn} className="flex items-center gap-4 group">
                <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-amber-600 transition-colors duration-300 shadow-inner">
                   <feature.icon size={24} className="text-amber-500 group-hover:text-black transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-wider text-white text-[12px]">{feature.title}</h3>
                  <p className="text-zinc-400 text-[10px] uppercase tracking-wider">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* FEATURED PRODUCTS SECTION */}
        <section id="catalogo" className="max-w-7xl mx-auto px-4 py-16 min-h-screen">
          
          {query && (
            <div className="mb-10 text-center bg-black/60 backdrop-blur-sm py-4 rounded-sm border-l-4 border-amber-500 shadow-xl">
               <h2 className="text-2xl font-black text-white uppercase tracking-widest">
                 Resultados para <span className="text-amber-500">"{query}"</span>
               </h2>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-white font-black tracking-widest uppercase animate-pulse">Carregando catálogo premium...</div>
          ) : (
            Object.keys(groupedProducts).length === 0 ? (
              <div className="text-center py-20 text-white font-bold bg-black/50 backdrop-blur-sm rounded-sm">Nenhum produto encontrado.</div>
            ) : (
              Object.entries(groupedProducts).map(([categoryName, categoryProducts], index) => (
                <div key={categoryName} className="mb-16">
                  {/* Category Header */}
                  <motion.div 
                    className="mb-8 flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                     <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-amber-600/50"></div>
                     <h2 className="text-3xl md:text-4xl font-serif font-black text-white uppercase tracking-widest drop-shadow-xl bg-transparent px-6 py-2">
                       {categoryName}
                     </h2>
                     <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-amber-600/50"></div>
                  </motion.div>

                  {/* Category Grid */}
                  <motion.div 
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                  >
                    {categoryProducts.map((product) => (
                      <motion.div 
                        key={product.id} 
                        variants={fadeIn}
                        className="border-2 border-zinc-900 rounded-lg hover:border-amber-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.8)] transition-all duration-300 flex flex-col bg-zinc-900 group hover:-translate-y-2 overflow-hidden shadow-2xl"
                      >
                        {/* Image Area */}
                        <Link href={`/produto/${product.id}`} className="p-4 flex justify-center items-center h-56 bg-gradient-to-b from-white to-zinc-200 mb-2 overflow-hidden border-b-4 border-zinc-950 relative">
                           {product.image_url ? (
                             <img src={product.image_url} alt={product.name} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl" />
                           ) : (
                             <div className="w-16 h-36 bg-gray-800 rounded-t-[30px] rounded-b-sm shadow-md flex items-end justify-center pb-2 group-hover:scale-110 transition-transform duration-500">
                                <div className="w-12 h-16 bg-[#e4d0b1] rounded-[2px] flex flex-col items-center justify-center">
                                   <div className="w-8 h-8 rounded-full border border-black/20 flex items-center justify-center">
                                     <span className="text-[6px] font-black text-black">LABEL</span>
                                   </div>
                                </div>
                             </div>
                           )}
                        </Link>
                        
                        {/* Content */}
                        <div className="px-4 flex-1 flex flex-col pt-2">
                          <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-1">{product.brand}</p>
                          <Link href={`/produto/${product.id}`} className="font-bold text-white text-[13px] leading-snug mb-2 line-clamp-2 hover:text-amber-500 transition-colors">
                            {product.name}
                          </Link>
                          
                          <div className="flex text-amber-500 mb-3 gap-0.5">
                            <Star size={10} fill="currentColor" />
                            <Star size={10} fill="currentColor" />
                            <Star size={10} fill="currentColor" />
                            <Star size={10} fill="currentColor" />
                            <Star size={10} fill="currentColor" />
                          </div>
                          
                          <div className="mt-auto mb-4 bg-black/30 rounded p-2 text-center border border-zinc-800">
                            <span className="font-black text-amber-500 text-lg">
                              R$ {Number(product.price).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Add to Cart Button */}
                        <button 
                          onClick={(e) => { e.preventDefault(); addItem(product); toast.success(`${product.name} adicionado!`); }}
                          className="w-full py-4 text-[11px] font-black tracking-widest uppercase bg-zinc-950 text-zinc-400 hover:bg-amber-600 hover:text-black transition-colors duration-300 border-t border-black"
                        >
                          Adicionar
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              ))
            )
          )}
        </section>

      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-900 flex items-center justify-center text-amber-600 font-black tracking-widest uppercase">Carregando...</div>}>
      <HomeContent />
    </Suspense>
  );
}
