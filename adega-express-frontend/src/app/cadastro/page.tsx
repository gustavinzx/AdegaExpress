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
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao criar conta. Verifique os dados informados.';
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
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#f4efe6] leading-tight">
              Faça parte da nossa curadoria sem álcool.
            </h1>
            <ul className="space-y-2.5 text-xs text-[#9e9589] pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#c9a256] shrink-0" />
                <span>Águas minerais, sucos integrais, refrigerantes e chás.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#c9a256] shrink-0" />
                <span>Múltiplos endereços de entrega salvos no perfil.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#c9a256] shrink-0" />
                <span>Checkout demonstrativo rápido e sem cobrança real.</span>
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-[#9e9589]/80 border-t border-[#c9a256]/12 pt-4">
            Cadastro simplificado — sem exigência de maioridade.
          </p>
        </div>

        {/* Right Form Console (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#c9a256]">
              Nova Conta
            </span>
            <h2 className="font-serif text-3xl font-semibold text-[#f4efe6] mt-1">
              Criar conta de cliente
            </h2>
            <p className="text-xs text-[#9e9589] mt-1.5">
              Já possui uma conta?{' '}
              <Link href="/login" className="text-[#c9a256] hover:underline font-semibold ml-1">
                Fazer login
              </Link>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-4 text-sm text-[#f4efe6] placeholder-[#9e9589]/50 focus:outline-none focus:border-[#c9a256]"
                placeholder="Ex.: Maria Clara Silva"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-4 text-sm text-[#f4efe6] placeholder-[#9e9589]/50 focus:outline-none focus:border-[#c9a256]"
                placeholder="maria@email.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                Senha (mínimo de 8 caracteres)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-4 text-sm text-[#f4efe6] placeholder-[#9e9589]/50 focus:outline-none focus:border-[#c9a256]"
                placeholder="Mínimo de 8 caracteres"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-[0_8px_25px_rgba(201,162,86,0.25)]"
              >
                <span>{loading ? 'Registrando...' : 'Concluir Cadastro'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
