'use client';

import Link from 'next/link';
import { Search, ShoppingCart, User, LogOut, Sparkles, ShieldCheck, Truck, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}#catalogo`);
    } else {
      router.push('/#catalogo');
    }
  };

  return (
    <header className="w-full bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50 shadow-2xl">
      {/* Top Academic Demonstration Bar */}
      <div className="bg-amber-600 text-black text-[10px] font-black uppercase tracking-widest text-center py-1.5 px-4 flex justify-center items-center gap-2">
        <Sparkles size={12} strokeWidth={2.5} />
        Loja Virtual Demonstrativa Exclusivamente de Bebidas Não Alcoólicas • Sem Cobrança Financeira Real
        <Sparkles size={12} strokeWidth={2.5} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 md:gap-8">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="bg-zinc-900 p-1 rounded-full border border-zinc-800 group-hover:border-amber-500 transition-colors">
            <img src="/logo.jpg" alt="Adega Express" className="w-11 h-11 rounded-full object-cover" />
          </div>
          <div>
            <span className="text-lg md:text-xl font-black text-white tracking-tighter uppercase group-hover:text-amber-500 transition-colors block leading-none">
              Adega<span className="text-amber-500 group-hover:text-white transition-colors">Express</span>
            </span>
            <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold block mt-0.5">
              Água • Sucos • Refrigerantes • Chás
            </span>
          </div>
        </Link>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative" role="search">
          <label htmlFor="navbar-search" className="sr-only">
            Buscar águas, sucos, refrigerantes ou chás
          </label>
          <input
            id="navbar-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar águas, sucos, refrigerantes ou chás..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-full py-2.5 px-5 pr-12 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-zinc-500 font-medium"
          />
          <button
            type="submit"
            aria-label="Buscar produtos"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-amber-600 rounded-full text-black hover:bg-amber-500 transition-colors"
          >
            <Search size={16} strokeWidth={2.5} />
          </button>
        </form>

        {/* NAVIGATION & ACTIONS */}
        <nav className="flex items-center gap-3 md:gap-5" aria-label="Menu principal">
          <Link
            href="/#catalogo"
            className="hidden lg:inline-block text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-amber-500 transition-colors"
          >
            Catálogo
          </Link>
          <Link
            href="/#ajuda"
            className="hidden lg:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-amber-500 transition-colors"
          >
            <HelpCircle size={14} /> Ajuda
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              {user.role === 'CLIENTE' && (
                <Link
                  href="/pedidos"
                  className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-amber-500 transition-colors"
                >
                  Meus Pedidos
                </Link>
              )}
              <Link
                href="/perfil"
                className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full"
              >
                <User size={16} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">
                  {user.name.split(' ')[0]}
                </span>
              </Link>
              {(user.role === 'ADMINISTRADOR' || user.role === 'ATENDENTE') && (
                <Link
                  href="/admin"
                  className="text-[10px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/60 bg-amber-500/10 px-2.5 py-1.5 rounded hover:bg-amber-500 hover:text-black transition-colors flex items-center gap-1"
                >
                  <ShieldCheck size={13} />
                  {user.role === 'ADMINISTRADOR' ? 'Painel Admin' : 'Operação'}
                </Link>
              )}
              {user.role === 'ENTREGADOR' && (
                <Link
                  href="/entregador"
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/60 bg-emerald-500/10 px-2.5 py-1.5 rounded hover:bg-emerald-500 hover:text-black transition-colors flex items-center gap-1"
                >
                  <Truck size={13} /> Entregas
                </Link>
              )}
              <button
                onClick={() => void logout()}
                className="text-zinc-400 hover:text-red-400 transition-colors p-1.5"
                title="Encerrar sessão"
                aria-label="Sair da conta"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-zinc-300 hover:text-amber-500 transition-colors text-xs font-bold uppercase tracking-wider px-3 py-2"
              >
                <User size={16} />
                <span>Entrar</span>
              </Link>
              <Link
                href="/cadastro"
                className="hidden sm:inline-block bg-amber-600 hover:bg-amber-500 text-black text-[11px] font-black uppercase tracking-widest px-3.5 py-2 rounded transition-colors"
              >
                Cadastrar
              </Link>
            </div>
          )}

          {/* CART */}
          <Link
            href="/carrinho"
            aria-label={`Carrinho de compras com ${itemCount} itens`}
            className="flex items-center gap-2 text-white hover:text-amber-500 transition-colors relative group"
          >
            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-full group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-500 transition-colors">
              <ShoppingCart size={18} />
            </div>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-zinc-950">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* MOBILE SEARCH BAR */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative w-full" role="search">
          <label htmlFor="navbar-mobile-search" className="sr-only">
            Buscar bebidas não alcoólicas
          </label>
          <input
            id="navbar-mobile-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar águas, sucos, refrigerantes ou chás..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-full py-2 px-4 pr-10 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-zinc-500"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-amber-600 rounded-full text-black"
          >
            <Search size={14} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </header>
  );
}
