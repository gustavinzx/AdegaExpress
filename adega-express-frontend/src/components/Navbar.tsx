'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import {
  ShoppingCart,
  User as UserIcon,
  LogOut,
  Search,
  Package,
  Truck,
  Shield,
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
        placeholder="Buscar águas, sucos, refrigerantes, chás..."
        className="w-full h-11 bg-zinc-900 border border-zinc-800 text-white text-sm rounded-full pl-5 pr-12 focus:outline-none focus:border-amber-500 transition-colors placeholder-zinc-500"
      />
      <button
        type="submit"
        aria-label="Pesquisar"
        className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-amber-600 hover:bg-amber-500 text-black flex items-center justify-center transition-colors cursor-pointer"
      >
        <Search size={15} strokeWidth={2.5} />
      </button>
    </form>
  );
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="bg-black p-1 rounded-full border border-zinc-800 group-hover:border-amber-500 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="Adega Express"
                className="w-11 h-11 rounded-full object-cover"
              />
            </div>
            <span className="text-xl font-serif font-black text-white tracking-wider uppercase">
              Adega<span className="text-amber-500">Express</span>
            </span>
          </Link>

          {/* SEARCH BAR (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <Suspense
              fallback={
                <div className="w-full h-11 bg-zinc-900 rounded-full border border-zinc-800 animate-pulse" />
              }
            >
              <SearchInput />
            </Suspense>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user?.role === 'CLIENTE' && (
                  <Link
                    href="/pedidos"
                    className="flex items-center gap-1.5 text-zinc-300 hover:text-amber-500 text-xs font-bold uppercase tracking-wider px-2.5 py-2 transition-colors"
                  >
                    <Package size={17} />
                    <span className="hidden lg:inline">Pedidos</span>
                  </Link>
                )}

                {(user?.role === 'ADMINISTRADOR' || user?.role === 'ATENDENTE') && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500 border border-amber-500/50 px-3 py-2 rounded-lg hover:bg-amber-500 hover:text-black transition-colors"
                  >
                    <Shield size={15} />
                    <span>{user.role === 'ADMINISTRADOR' ? 'Admin' : 'Pedidos'}</span>
                  </Link>
                )}

                {user?.role === 'ENTREGADOR' && (
                  <Link
                    href="/entregador"
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/50 px-3 py-2 rounded-lg hover:bg-emerald-500 hover:text-black transition-colors"
                  >
                    <Truck size={15} />
                    <span>Entregas</span>
                  </Link>
                )}

                <Link
                  href="/perfil"
                  className="flex items-center gap-2 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider px-2 py-2 transition-colors"
                >
                  <UserIcon size={18} />
                  <span className="hidden sm:inline">{user?.name?.split(' ')[0]}</span>
                </Link>

                <button
                  onClick={() => void logout()}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-zinc-300 hover:text-amber-500 text-xs font-bold uppercase tracking-wider px-3 py-2 transition-colors"
                >
                  <UserIcon size={18} />
                  <span>Entrar</span>
                </Link>
                <Link
                  href="/cadastro"
                  className="hidden sm:inline-flex items-center justify-center h-10 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Cadastrar
                </Link>
              </div>
            )}

            {/* CART */}
            <Link
              href="/carrinho"
              className="relative flex items-center justify-center w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-white hover:text-amber-500 transition-colors"
              title="Carrinho"
            >
              <ShoppingCart size={19} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* MOBILE SEARCH */}
        <div className="md:hidden pb-3">
          <Suspense
            fallback={
              <div className="w-full h-11 bg-zinc-900 rounded-full border border-zinc-800 animate-pulse" />
            }
          >
            <SearchInput />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
