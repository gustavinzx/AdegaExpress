'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { GlassWater, ArrowRight, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Left Informational Sidebar (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-teal-800 to-teal-950 p-8 sm:p-10 text-white flex flex-col justify-between space-y-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border border-teal-500/40 bg-teal-900 flex items-center justify-center">
              <GlassWater size={18} className="text-teal-200" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white block leading-none">
                ADEGA <span className="text-amber-400 font-bold">Express</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-teal-200 font-semibold">
                bebidas não alcoólicas
              </span>
            </div>
          </Link>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Acesse sua conta
            </h1>
            <p className="text-xs text-teal-100 leading-relaxed">
              Consulte seus pedidos, salve endereços para entrega rápida e acompanhe suas compras na Adega Express.
            </p>
          </div>

          <div className="rounded-2xl bg-teal-900/60 border border-teal-700/60 p-4 space-y-2 text-xs text-teal-200">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <ShieldCheck size={14} />
              <span>Contas de Demonstração</span>
            </div>
            <p className="text-[11px] leading-relaxed text-teal-100">
              Admin: <code className="text-white font-mono">admin@adegaexpress.com</code><br />
              Cliente: <code className="text-white font-mono">cliente@adegaexpress.com</code><br />
              Senha: <code className="text-amber-300 font-mono font-bold">Admin@123</code>
            </p>
          </div>
        </div>

        {/* Right Form Console (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Acesso
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              Entrar na sua conta
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Novo cliente?{' '}
              <Link href="/cadastro" className="text-teal-700 hover:underline font-bold ml-1">
                Criar conta gratuita
              </Link>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-medium"
                placeholder="seuemail@exemplo.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Senha
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-medium"
                placeholder="Sua senha"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span>{loading ? 'Entrando...' : 'Entrar no Sistema'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-teal-700 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
