'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import {
  ShoppingBag,
  User as UserIcon,
  LogOut,
  Search,
  Package,
  Truck,
  Shield,
  HelpCircle,
  GlassWater,
} from 'lucide-react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}#catalogo`);
    } else {
      router.push('/#catalogo');
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar águas, sucos integrais, chás ou refrigerantes..."
        className="w-full h-11 bg-[#161310]/90 text-[#f4efe6] pl-4 pr-12 rounded-full border border-[#c9a256]/20 focus:outline-none focus:border-[#c9a256]/60 focus:ring-2 focus:ring-[#c9a256]/15 transition-all text-xs placeholder-[#9e9589]"
      />
      <button
        type="submit"
        aria-label="Pesquisar no catálogo"
        className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-[#c9a256]/15 hover:bg-[#c9a256] text-[#c9a256] hover:text-[#0e0c0a] flex items-center justify-center transition-all cursor-pointer"
      >
        <Search size={14} />
      </button>
    </form>
  );
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0e0c0a]/90 border-b border-[#c9a256]/15">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          {/* Brand Crest */}
          <Link href="/" className="flex items-center gap-3.5 group shrink-0">
            <div className="h-11 w-11 rounded-full border border-[#c9a256]/40 bg-gradient-to-br from-[#231d17] to-[#120f0c] flex items-center justify-center shadow-[0_0_25px_rgba(201,162,86,0.12)] group-hover:border-[#c9a256] transition-all">
              <GlassWater size={20} className="text-[#c9a256]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl sm:text-[26px] font-bold tracking-[0.08em] text-[#f4efe6] leading-none">
                ADEGA <span className="text-[#c9a256] italic font-normal">Express</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.28em] text-[#9e9589] mt-1">
                Boutique de Bebidas Sem Álcool
              </span>
            </div>
          </Link>

          {/* Search Console (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <Suspense
              fallback={
                <div className="w-full h-11 bg-[#161310] rounded-full border border-[#c9a256]/15 animate-pulse" />
              }
            >
              <SearchInput />
            </Suspense>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/#catalogo"
              className="hidden lg:inline-flex items-center h-11 px-3.5 text-xs font-medium uppercase tracking-[0.14em] text-[#f4efe6]/80 hover:text-[#c9a256] transition-colors"
            >
              Catálogo
            </Link>

            <Link
              href="/#ajuda"
              className="hidden sm:inline-flex items-center gap-1.5 h-11 px-3 text-xs font-medium uppercase tracking-[0.14em] text-[#9e9589] hover:text-[#c9a256] transition-colors"
              title="Central de Ajuda"
            >
              <HelpCircle size={15} />
              <span className="hidden lg:inline">Ajuda</span>
            </Link>

            {/* Cart Trigger */}
            <Link
              href="/carrinho"
              className="relative inline-flex items-center gap-2.5 h-11 px-4 rounded-full bg-[#181411] hover:bg-[#221c17] border border-[#c9a256]/25 text-[#f4efe6] transition-all"
              title="Sacola de Compras"
            >
              <ShoppingBag size={17} className="text-[#c9a256]" />
              <span className="hidden sm:inline text-xs font-medium tracking-wider uppercase">
                Sacola
              </span>
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#c9a256] text-[#0e0c0a] text-[11px] font-bold font-mono">
                {itemCount}
              </span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#c9a256]/15">
                {user?.role === 'CLIENTE' && (
                  <Link
                    href="/pedidos"
                    className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-full bg-[#161310] hover:bg-[#211c17] border border-[#c9a256]/15 text-xs font-medium tracking-wider uppercase text-[#f4efe6] hover:text-[#c9a256] transition-all"
                    title="Meus Pedidos"
                  >
                    <Package size={15} className="text-[#c9a256]" />
                    <span className="hidden xl:inline">Pedidos</span>
                  </Link>
                )}

                {(user?.role === 'ADMINISTRADOR' || user?.role === 'ATENDENTE') && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-full bg-[#c9a256]/15 hover:bg-[#c9a256]/25 border border-[#c9a256]/40 text-xs font-semibold tracking-wider uppercase text-[#c9a256] transition-all"
                  >
                    <Shield size={15} />
                    <span className="hidden sm:inline">
                      {user.role === 'ADMINISTRADOR' ? 'Painel Admin' : 'Operação'}
                    </span>
                  </Link>
                )}

                {user?.role === 'ENTREGADOR' && (
                  <Link
                    href="/entregador"
                    className="inline-flex items-center gap-1.5 h-11 px-3.5 rounded-full bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-xs font-semibold tracking-wider uppercase text-emerald-300 transition-all"
                  >
                    <Truck size={15} />
                    <span className="hidden sm:inline">Entregas</span>
                  </Link>
                )}

                <Link
                  href="/perfil"
                  className="inline-flex items-center gap-2 h-11 px-3.5 rounded-full bg-[#161310] hover:bg-[#211c17] border border-[#c9a256]/15 text-xs font-medium text-[#f4efe6] hover:text-[#c9a256] transition-all"
                  title="Meu Perfil"
                >
                  <UserIcon size={15} className="text-[#c9a256]" />
                  <span className="hidden lg:inline max-w-[110px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                </Link>

                <button
                  onClick={() => void logout()}
                  className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-[#161310] hover:bg-red-950/40 border border-[#c9a256]/15 hover:border-red-500/30 text-[#9e9589] hover:text-red-400 transition-all cursor-pointer"
                  title="Encerrar Sessão"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-[#c9a256]/15">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-11 px-4 rounded-full text-xs font-medium uppercase tracking-[0.14em] text-[#f4efe6] hover:text-[#c9a256] transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.14em] transition-all shadow-[0_4px_20px_rgba(201,162,86,0.25)]"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3.5">
          <Suspense
            fallback={
              <div className="w-full h-11 bg-[#161310] rounded-full border border-[#c9a256]/15 animate-pulse" />
            }
          >
            <SearchInput />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
