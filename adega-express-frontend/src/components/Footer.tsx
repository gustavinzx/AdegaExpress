'use client';

import Link from 'next/link';
import { ShieldCheck, Globe, Mail, MapPin, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Hide footer on dashboard apps
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/entregador')) {
    return null;
  }

  return (
    <footer className="bg-black border-t border-zinc-900 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.jpg" alt="Adega Express Logo" className="w-12 h-12 rounded-full border border-amber-600" />
              <span className="font-black text-white text-xl tracking-tighter">ADEGA<span className="text-amber-500">EXPRESS</span></span>
            </div>
            <p className="text-zinc-500 text-xs mb-6 max-w-xs">
              Sua distribuidora premium de bebidas. Entregamos os melhores momentos na porta da sua casa com agilidade e temperatura ideal.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-amber-500 hover:bg-amber-600 hover:text-black transition-colors"><Globe size={16} /></a>
              <a href="#" className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-amber-500 hover:bg-amber-600 hover:text-black transition-colors"><Mail size={16} /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-4">Departamentos</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/?q=Cerveja" className="hover:text-amber-500 transition-colors">Cervejas</Link></li>
              <li><Link href="/?q=Destilado" className="hover:text-amber-500 transition-colors">Destilados</Link></li>
              <li><Link href="/?q=Tabaco" className="hover:text-amber-500 transition-colors">Tabacaria</Link></li>
              <li><Link href="/?q=Não Alcoólico" className="hover:text-amber-500 transition-colors">Não Alcoólicos</Link></li>
            </ul>
          </div>

          {/* Ajuda */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-4">Atendimento</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/perfil" className="hover:text-amber-500 transition-colors">Minha Conta</Link></li>
              <li><Link href="/pedidos" className="hover:text-amber-500 transition-colors">Meus Pedidos</Link></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Política de Entrega</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Termos de Uso (18+)</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-4">Contato</h4>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-amber-500 flex-shrink-0" />
                <span className="text-xs">Quadra 112 Conjunto 6, Lote 4<br/>Recanto das Emas, Brasília - DF</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-amber-500 flex-shrink-0" />
                <span className="text-xs">(61) 99999-9999</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            © 2026 Adega Express. Beba com moderação. Venda proibida para menores de 18 anos.
          </p>
          
          {/* Botão Escudinho Admin */}
          {(user?.role === 'ADMINISTRADOR' || user?.role === 'ATENDENTE') && (
            <Link 
              href="/admin" 
              title="Acessar Painel de Controle"
              className="group flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 hover:border-amber-500 hover:bg-amber-600/10 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-amber-500/20"
            >
              <ShieldCheck size={18} className="text-zinc-500 group-hover:text-amber-500 transition-colors" />
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
