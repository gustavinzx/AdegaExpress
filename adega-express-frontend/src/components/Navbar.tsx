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
        placeholder="Buscar águas, sucos, chás ou refrigerantes..."
        className="w-full h-10 bg-slate-50 text-slate-900 pl-3.5 pr-10 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/15 transition-all text-xs placeholder-slate-400 font-medium"
      />
      <button
        type="submit"
        aria-label="Pesquisar no catálogo"
        className="absolute right-1 top-1 h-8 w-8 rounded-lg bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white flex items-center justify-center transition-all cursor-pointer"
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
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-2 sm:gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-teal-200 bg-teal-50 flex items-center justify-center shadow-xs group-hover:border-teal-500 transition-all">
              <GlassWater size={18} className="text-teal-700" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-slate-900 leading-none">
                ADEGA <span className="text-teal-700 font-bold">Express</span>
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5 sm:mt-1">
                bebidas não alcoólicas
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <Suspense
              fallback={
                <div className="w-full h-10 bg-slate-100 rounded-xl border border-slate-200 animate-pulse" />
              }
            >
              <SearchInput />
            </Suspense>
          </div>

          {/* Right Navigation & User Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/#catalogo"
              className="hidden lg:inline-flex items-center h-10 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-teal-700 transition-colors"
            >
              Catálogo
            </Link>

            <Link
              href="/#ajuda"
              className="hidden sm:inline-flex items-center gap-1.5 h-10 px-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-teal-700 transition-colors"
              title="Perguntas Frequentes"
            >
              <HelpCircle size={15} />
              <span className="hidden xl:inline">Ajuda</span>
            </Link>

            {/* Cart Trigger (Apenas clientes e visitantes) */}
            {(!isAuthenticated || user?.role === 'CLIENTE') && (
              <Link
                href="/carrinho"
                className="relative inline-flex items-center gap-2 h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-all font-semibold"
                title="Sacola de Compras"
              >
                <ShoppingBag size={16} className="text-teal-700" />
                <span className="hidden sm:inline text-xs tracking-wide">Sacola</span>
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-teal-700 text-white text-[11px] font-bold">
                  {itemCount}
                </span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-slate-200">
                {user?.role === 'CLIENTE' && (
                  <Link
                    href="/pedidos"
                    className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-all"
                    title="Meus Pedidos"
                  >
                    <Package size={15} className="text-teal-700" />
                    <span className="hidden xl:inline">Pedidos</span>
                  </Link>
                )}

                {(user?.role === 'ADMINISTRADOR' || user?.role === 'ATENDENTE') && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-xs font-semibold text-white shadow-xs transition-all"
                  >
                    <Shield size={14} />
                    <span className="hidden sm:inline">
                      {user.role === 'ADMINISTRADOR' ? 'Painel Admin' : 'Painel Atendente'}
                    </span>
                  </Link>
                )}

                {user?.role === 'ENTREGADOR' && (
                  <Link
                    href="/entregador"
                    className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-xs font-semibold text-white shadow-xs transition-all"
                  >
                    <Truck size={14} />
                    <span className="hidden sm:inline">Entregas</span>
                  </Link>
                )}

                <Link
                  href="/perfil"
                  className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-all"
                  title="Meu Perfil"
                >
                  <UserIcon size={14} className="text-teal-700" />
                  <span className="hidden lg:inline max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                </Link>

                <button
                  onClick={() => void logout()}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 transition-all cursor-pointer"
                  title="Encerrar Sessão"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="hidden sm:inline-flex items-center justify-center h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs tracking-wide transition-all shadow-xs"
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3 pt-1">
          <Suspense
            fallback={
              <div className="w-full h-10 bg-slate-100 rounded-xl border border-slate-200 animate-pulse" />
            }
          >
            <SearchInput />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
