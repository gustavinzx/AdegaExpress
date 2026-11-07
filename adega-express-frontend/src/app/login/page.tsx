'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { GlassWater, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const redirect = searchParams?.get('redirect') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post<{ token: string; user: User }>('/auth/login', {
        email,
        password,
      });

      login(response.token, response.user);
      toast.success(`Bem-vindo(a), ${response.user.name.split(' ')[0]}!`);

      if (redirect) {
        router.push(redirect);
      } else if (
        response.user.role === 'ADMINISTRADOR' ||
        response.user.role === 'ATENDENTE'
      ) {
        router.push('/admin');
      } else if (response.user.role === 'ENTREGADOR') {
        router.push('/entregador');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'E-mail ou senha inválidos.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0c0a] text-[#f4efe6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-[#c9a256]/20 bg-[#14110e] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.75)]">
        {/* Left Editorial Manifesto (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#1f1914] via-[#15120f] to-[#0e0c0a] p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#c9a256]/15 flex flex-col justify-between space-y-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border border-[#c9a256]/40 bg-[#161310] flex items-center justify-center">
              <GlassWater size={18} className="text-[#c9a256]" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-[0.08em] text-[#f4efe6] block leading-none">
                ADEGA <span className="text-[#c9a256] italic font-normal">Express</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.24em] text-[#9e9589]">
                Maison Não Alcoólica
              </span>
            </div>
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a256]/25 bg-[#0e0c0a]/60 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#c9a256]">
              <Sparkles size={12} />
              <span>Acesso Seguro (UC13)</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#f4efe6] leading-tight">
              Sua adega particular de bebidas refrescantes.
            </h1>
            <p className="text-xs sm:text-sm text-[#9e9589] leading-relaxed">
              Acesse sua conta para gerenciar endereços de entrega, aplicar cupons promocionais e
              acompanhar o preparo de cada pedido.
            </p>
          </div>

          <div className="pt-4 border-t border-[#c9a256]/12 flex items-center gap-2.5 text-xs text-[#9e9589]">
            <ShieldCheck size={16} className="text-[#c9a256] shrink-0" />
            <span>Sessão protegida com criptografia e cookie HttpOnly (RNF07).</span>
          </div>
        </div>

        {/* Right Form Console (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#c9a256]">
              Identificação
            </span>
            <h2 className="font-serif text-3xl font-semibold text-[#f4efe6] mt-1">
              Entrar na sua conta
            </h2>
            <p className="text-xs text-[#9e9589] mt-1.5">
              Ainda não possui cadastro?{' '}
              <Link
                href="/cadastro"
                className="text-[#c9a256] hover:underline font-semibold ml-1"
              >
                Criar conta de cliente
              </Link>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                E-mail Cadastrado
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-4 text-sm text-[#f4efe6] placeholder-[#9e9589]/50 focus:outline-none focus:border-[#c9a256]"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                Senha de Acesso
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-4 text-sm text-[#f4efe6] placeholder-[#9e9589]/50 focus:outline-none focus:border-[#c9a256]"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-[0_8px_25px_rgba(201,162,86,0.25)]"
              >
                <span>{loading ? 'Autenticando...' : 'Acessar Conta'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-[#c9a256]/10 text-center">
            <Link
              href="/"
              className="text-xs font-medium text-[#9e9589] hover:text-[#c9a256] transition-colors"
            >
              Voltar para a vitrine pública
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0e0c0a] text-[#c9a256] flex items-center justify-center font-serif text-2xl">
          Carregando...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
