'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Truck } from 'lucide-react';

export default function Footer() {
  const { user, isAuthenticated } = useAuth();

  return (
    <footer className="bg-black border-t border-zinc-900 text-zinc-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-zinc-900">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="Adega Express"
                className="w-10 h-10 rounded-full border border-zinc-800 object-cover"
              />
              <span className="text-lg font-serif font-black text-white tracking-wider uppercase">
                Adega<span className="text-amber-500">Express</span>
              </span>
            </Link>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Loja de bebidas não alcoólicas — águas, sucos, refrigerantes e chás com entrega
              rápida.
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Categorias</h4>
            <ul className="space-y-2 text-xs">
              {['Água', 'Sucos', 'Refrigerantes', 'Chás'].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/?category=${encodeURIComponent(cat)}#catalogo`}
                    className="hover:text-amber-500 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">Navegação</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#catalogo" className="hover:text-amber-500 transition-colors">
                  Catálogo de Produtos
                </Link>
              </li>
              <li>
                <Link href="/carrinho" className="hover:text-amber-500 transition-colors">
                  Carrinho de Compras
                </Link>
              </li>
              <li>
                <Link href="/#ajuda" className="hover:text-amber-500 transition-colors">
                  Dúvidas Frequentes
                </Link>
              </li>
              {!isAuthenticated && (
                <li>
                  <Link href="/login" className="hover:text-amber-500 transition-colors">
                    Entrar / Cadastrar
                  </Link>
                </li>
              )}
            </ul>

            {isAuthenticated &&
              (user?.role === 'ADMINISTRADOR' ||
                user?.role === 'ATENDENTE' ||
                user?.role === 'ENTREGADOR') && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {(user.role === 'ADMINISTRADOR' || user.role === 'ATENDENTE') && (
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 rounded bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-bold text-amber-500 hover:border-amber-500 transition-colors"
                    >
                      <Shield size={13} />
                      <span>Painel {user.role === 'ADMINISTRADOR' ? 'Admin' : 'Atendente'}</span>
                    </Link>
                  )}
                  {user.role === 'ENTREGADOR' && (
                    <Link
                      href="/entregador"
                      className="inline-flex items-center gap-1.5 rounded bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:border-emerald-500 transition-colors"
                    >
                      <Truck size={13} />
                      <span>Painel do Entregador</span>
                    </Link>
                  )}
                </div>
              )}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Adega Express. Todos os direitos reservados.</p>
          <p>Projeto acadêmico demonstrativo — sem cobrança financeira real.</p>
        </div>
      </div>
    </footer>
  );
}
