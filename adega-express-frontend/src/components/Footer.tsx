'use client';

import Link from 'next/link';
import { ShieldCheck, Mail, MapPin, Phone, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/entregador')) {
    return null;
  }

  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 pt-14 pb-8 mt-auto text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.jpg"
                alt="Adega Express Logo"
                className="w-11 h-11 rounded-full border border-amber-600 object-cover"
              />
              <div>
                <span className="font-black text-white text-lg tracking-tighter block leading-none">
                  ADEGA<span className="text-amber-500">EXPRESS</span>
                </span>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                  Bebidas Não Alcoólicas
                </span>
              </div>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed mb-4">
              Loja virtual demonstrativa de bebidas não alcoólicas (Água, Sucos, Refrigerantes e Chás), com controle de estoque em tempo real e gestão de entregas.
            </p>
            <div className="bg-zinc-900/90 border border-zinc-800 rounded p-2.5 text-[11px] text-zinc-300 flex items-start gap-2">
              <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <span>
                Ambiente acadêmico demonstrativo (v4.3): nenhuma cobrança ou transação financeira real é realizada.
              </span>
            </div>
          </div>

          {/* Categorias Permitidas */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-4">
              Categorias
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/?category=%C3%81gua#catalogo" className="hover:text-amber-500 transition-colors">
                  Água Mineral & Com Gás
                </Link>
              </li>
              <li>
                <Link href="/?category=Sucos#catalogo" className="hover:text-amber-500 transition-colors">
                  Sucos Integrais & Néctares
                </Link>
              </li>
              <li>
                <Link href="/?category=Refrigerantes#catalogo" className="hover:text-amber-500 transition-colors">
                  Refrigerantes
                </Link>
              </li>
              <li>
                <Link href="/?category=Ch%C3%A1s#catalogo" className="hover:text-amber-500 transition-colors">
                  Chás Gelados
                </Link>
              </li>
            </ul>
          </div>

          {/* Área do Cliente e Ajuda */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-4">
              Acesso Rápido & Ajuda
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/perfil" className="hover:text-amber-500 transition-colors">
                  Minha Conta e Endereços
                </Link>
              </li>
              <li>
                <Link href="/pedidos" className="hover:text-amber-500 transition-colors">
                  Acompanhar Meus Pedidos
                </Link>
              </li>
              <li>
                <Link href="/carrinho" className="hover:text-amber-500 transition-colors">
                  Carrinho e Checkout Simulado
                </Link>
              </li>
              <li>
                <Link href="/#ajuda" className="hover:text-amber-500 transition-colors">
                  Ajuda On-line / Perguntas Frequentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-4">
              Atendimento e Suporte
            </h4>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <span>Distribuidora Adega Express — Atendimento Regional Configurável</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-amber-500 shrink-0" />
                <span>(11) 4000-0000 (Canal Demonstrativo)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-amber-500 shrink-0" />
                <span>contato@adegaexpress.example.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-zinc-500 font-semibold">
            © 2026 Adega Express — Projeto Acadêmico (Documento de Visão v4.3). Comercialização exclusiva de bebidas não alcoólicas.
          </p>

          {(user?.role === 'ADMINISTRADOR' || user?.role === 'ATENDENTE') && (
            <Link
              href="/admin"
              title="Acessar Painel Operacional / Administrativo"
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-500 hover:bg-amber-600/10 transition-all text-xs text-zinc-300 hover:text-amber-500"
            >
              <ShieldCheck size={16} className="text-amber-500" />
              <span className="font-bold uppercase tracking-wider text-[10px]">
                Painel {user.role === 'ADMINISTRADOR' ? 'Admin' : 'Atendente'}
              </span>
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
