'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { GlassWater, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post<{ user: User; token: string }>('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (response.token && response.user) {
        login(response.token, response.user);
      }

      toast.success('Conta criada com sucesso! Bem-vindo(a) à Adega Express.');
      router.push('/');
    } catch (err: unknown) {
      let errorMessage =
        err instanceof Error ? err.message : 'Erro ao criar conta. Verifique os dados informados.';
      if (errorMessage.includes('Registro já existente')) {
        errorMessage = 'Este e-mail já está cadastrado. Faça login na sua conta ou utilize outro e-mail.';
      }
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

          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Crie sua conta na Adega Express
            </h1>
            <ul className="space-y-2.5 text-xs text-teal-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
                <span>Águas minerais, sucos 100% integrais, refrigerantes e chás.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
                <span>Múltiplos endereços de entrega salvos no perfil.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
                <span>Checkout demonstrativo rápido e sem cobrança real.</span>
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-teal-300 border-t border-teal-800/80 pt-4">
            Cadastro simplificado para clientes.
          </p>
        </div>

        {/* Right Form Console (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Nova Conta
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              Criar conta de cliente
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Já possui uma conta?{' '}
              <Link href="/login" className="text-teal-700 hover:underline font-bold ml-1">
                Fazer login
              </Link>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-medium"
                placeholder="Ex.: Maria Clara Silva"
              />
            </div>

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
                placeholder="maria@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Senha (mínimo de 8 caracteres)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-medium"
                placeholder="Mínimo de 8 caracteres"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span>{loading ? 'Registrando...' : 'Concluir Cadastro'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
