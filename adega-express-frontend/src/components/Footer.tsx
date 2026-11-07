'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { GlassWater, Shield, Truck, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const { user, isAuthenticated } = useAuth();

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-500 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-200">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl border border-teal-200 bg-teal-50 flex items-center justify-center">
                <GlassWater size={18} className="text-teal-700" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                  ADEGA <span className="text-teal-700 font-bold">Express</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-1">
                  bebidas não alcoólicas
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Adega Express: bebidas não alcoólicas entregues rápido. Águas minerais, sucos 100% integrais, refrigerantes e chás para sua casa ou evento.
            </p>
          </div>

          {/* Col 2: Categories */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Categorias
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              {['Água', 'Sucos', 'Refrigerantes', 'Chás'].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/?category=${encodeURIComponent(cat)}#catalogo`}
                    className="inline-flex items-center gap-1.5 text-slate-600 hover:text-teal-700 transition-colors"
                  >
                    <span>{cat}</span>
                    <ArrowUpRight size={12} className="opacity-50" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Navigation & Help */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Navegação
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href="/#catalogo" className="text-slate-600 hover:text-teal-700 transition-colors">
                  Catálogo Completo
                </Link>
              </li>
              {(!isAuthenticated || user?.role === 'CLIENTE') && (
                <li>
                  <Link href="/carrinho" className="text-slate-600 hover:text-teal-700 transition-colors">
                    Sacola de Compras
                  </Link>
                </li>
              )}
              <li>
                <Link href="/#ajuda" className="text-slate-600 hover:text-teal-700 transition-colors">
                  Perguntas Frequentes
                </Link>
              </li>
              {!isAuthenticated && (
                <li>
                  <Link href="/login" className="text-slate-600 hover:text-teal-700 transition-colors">
                    Entrar na Conta
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
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-all"
                    >
                      <Shield size={13} className="text-teal-700" />
                      <span>{user.role === 'ADMINISTRADOR' ? 'Painel Admin' : 'Painel Atendente'}</span>
                    </Link>
                  )}
                  {user.role === 'ENTREGADOR' && (
                    <Link
                      href="/entregador"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-all"
                    >
                      <Truck size={13} className="text-teal-700" />
                      <span>Painel do Entregador</span>
                    </Link>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Bottom Legal & Academic Notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} Adega Express. Todos os direitos reservados.
          </p>
          <p className="text-center sm:text-right">
            Ambiente demonstrativo — nenhuma cobrança financeira real é realizada.
          </p>
        </div>
      </div>
    </footer>
  );
}
