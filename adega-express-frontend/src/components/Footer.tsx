'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { GlassWater, Shield, Truck, ArrowUpRight, Sparkles } from 'lucide-react';

export default function Footer() {
  const { user, isAuthenticated } = useAuth();

  return (
    <footer className="bg-[#0b0908] border-t border-[#c9a256]/15 text-[#9e9589] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#c9a256]/10">
          {/* Col 1: Brand Manifesto */}
          <div className="md:col-span-5 space-y-5">
            <Link href="/" className="inline-flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-full border border-[#c9a256]/40 bg-[#161310] flex items-center justify-center">
                <GlassWater size={18} className="text-[#c9a256]" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-[0.08em] text-[#f4efe6] leading-none">
                  ADEGA <span className="text-[#c9a256] italic font-normal">Express</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.26em] text-[#9e9589] mt-1">
                  Maison de Bebidas Não Alcoólicas
                </span>
              </div>
            </Link>
            <p className="text-sm text-[#9e9589] leading-relaxed max-w-md">
              Curadoria especializada em águas minerais de fonte, sucos 100% integrais,
              refrigerantes tradicionais e infusões botânicas prontas para o consumo doméstico e
              recepções.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a256]/20 bg-[#151210] px-3.5 py-1.5 text-[11px] text-[#c9a256]">
              <Sparkles size={13} />
              <span>Escopo 100% Não Alcoólico • Documento de Visão v4.3</span>
            </div>
          </div>

          {/* Col 2: Curated Categories */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f4efe6]">
              Coleções da Casa
            </h4>
            <ul className="space-y-2.5 text-sm">
              {['Água', 'Sucos', 'Refrigerantes', 'Chás'].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/?category=${encodeURIComponent(cat)}#catalogo`}
                    className="inline-flex items-center gap-1.5 text-[#9e9589] hover:text-[#c9a256] transition-colors"
                  >
                    <span>{cat}</span>
                    <ArrowUpRight size={13} className="opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Navigation & Support */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f4efe6]">
              Atendimento &amp; Acesso
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#catalogo" className="hover:text-[#c9a256] transition-colors">
                  Explorar Catálogo Completo
                </Link>
              </li>
              <li>
                <Link href="/carrinho" className="hover:text-[#c9a256] transition-colors">
                  Sacola &amp; Cotação de Entrega
                </Link>
              </li>
              <li>
                <Link href="/#ajuda" className="hover:text-[#c9a256] transition-colors">
                  Central de Ajuda &amp; Perguntas Frequentes
                </Link>
              </li>
              {!isAuthenticated && (
                <li>
                  <Link href="/login" className="hover:text-[#c9a256] transition-colors">
                    Acessar Conta ou Cadastrar-se
                  </Link>
                </li>
              )}
            </ul>

            {isAuthenticated &&
              (user?.role === 'ADMINISTRADOR' ||
                user?.role === 'ATENDENTE' ||
                user?.role === 'ENTREGADOR') && (
                <div className="pt-3 flex flex-wrap gap-2">
                  {(user.role === 'ADMINISTRADOR' || user.role === 'ATENDENTE') && (
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-2 rounded-full border border-[#c9a256]/30 bg-[#161310] px-3.5 py-2 text-xs font-medium text-[#c9a256] hover:bg-[#c9a256] hover:text-[#0e0c0a] transition-all"
                    >
                      <Shield size={14} />
                      <span>Mesa Operacional ({user.role})</span>
                    </Link>
                  )}
                  {user.role === 'ENTREGADOR' && (
                    <Link
                      href="/entregador"
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-900/50 transition-all"
                    >
                      <Truck size={14} />
                      <span>Console do Entregador</span>
                    </Link>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Bottom Legal & Academic Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9e9589]/80">
          <p>
            &copy; {new Date().getFullYear()} Adega Express. Todos os direitos reservados.
          </p>
          <p className="text-center sm:text-right">
            Ambiente acadêmico demonstrativo — nenhuma cobrança financeira real é realizada no
            checkout.
          </p>
        </div>
      </div>
    </footer>
  );
}
