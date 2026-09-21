'use client';

import Link from 'next/link';
import { Search, ShoppingCart, User, LogOut, Beer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
    <header className="w-full bg-zinc-950 border-b-2 border-amber-500 sticky top-0 z-50 shadow-2xl">
      {/* Top Warning Bar */}
      <div className="bg-amber-600 text-black text-[10px] font-black uppercase tracking-widest text-center py-1.5 px-4 flex justify-center items-center gap-2">
        <Beer size={12} strokeWidth={3} /> Beba com moderação. Venda proibida para menores de 18 anos. <Beer size={12} strokeWidth={3} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-8">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-black p-1 rounded-full border border-zinc-800 group-hover:border-amber-500 transition-colors">
            <img src="/logo.jpg" alt="Adega Express" className="w-12 h-12 rounded-full object-cover" />
          </div>
          <span className="text-xl font-black text-white tracking-tighter uppercase group-hover:text-amber-500 transition-colors">
            Adega<span className="text-amber-500 group-hover:text-white transition-colors">Express</span>
          </span>
        </Link>

        {/* SEARCH BAR (Sleek Dark Mode) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cervejas, destilados, tabacos..." 
            className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-full py-3 px-6 pr-12 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-zinc-500 font-medium"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-600 rounded-full text-black hover:bg-amber-500 transition-colors">
            <Search size={16} strokeWidth={3} />
          </button>
        </form>

        {/* ICONS & ACTIONS */}
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/perfil" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                <User size={20} />
                <span className="text-xs font-bold uppercase tracking-wider hidden md:block">
                  {user.name.split(' ')[0]}
                </span>
              </Link>
              {user.role === 'ADMINISTRADOR' && (
                <Link href="/admin" className="text-[10px] font-black uppercase tracking-widest text-amber-500 border border-amber-500 px-2 py-1 rounded hover:bg-amber-500 hover:text-black transition-colors">
                  Admin
                </Link>
              )}
              {user.role === 'ENTREGADOR' && (
                <Link href="/entregador" className="text-[10px] font-black uppercase tracking-widest text-green-500 border border-green-500 px-2 py-1 rounded hover:bg-green-500 hover:text-black transition-colors">
                  Entregas
                </Link>
              )}
              <button onClick={logout} className="text-zinc-500 hover:text-red-500 transition-colors" title="Sair">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors">
              <User size={20} />
              <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Entrar</span>
            </Link>
          )}

          {/* CART */}
          <Link href="/carrinho" className="flex items-center gap-2 text-white hover:text-amber-500 transition-colors relative group">
             <div className="bg-zinc-900 p-2 rounded-full group-hover:bg-amber-500 group-hover:text-black transition-colors">
               <ShoppingCart size={20} />
             </div>
             {itemCount > 0 && (
               <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-zinc-950">
                 {itemCount}
               </span>
             )}
          </Link>
        </div>

      </div>

      {/* MOBILE SEARCH BAR */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative w-full">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..." 
            className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-full py-2.5 px-4 pr-10 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-zinc-500"
          />
          <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-amber-600 rounded-full text-black">
            <Search size={14} strokeWidth={3} />
          </button>
        </form>
      </div>
    </header>
  );
}
