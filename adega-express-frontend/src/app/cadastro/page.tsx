// src/app/cadastro/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { User } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function CadastroForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post<{ token: string; user: User }>('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      login(res.token, res.user);
      router.push(redirect);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao realizar cadastro';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-zinc-900 p-8 md:p-10 rounded-xl shadow-2xl border border-zinc-800 border-t-4 border-t-amber-500">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-3">
              <img
                src="/logo.jpg"
                alt="Adega Express"
                className="w-16 h-16 rounded-full border-2 border-amber-500 shadow-lg mx-auto"
              />
            </Link>
            <h1 className="text-2xl font-serif font-black text-white uppercase tracking-wider">
              Criar Conta de Cliente
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Cadastre-se para gerenciar seus endereços e acompanhar pedidos
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-950/60 text-red-300 border border-red-800 p-3 rounded text-xs font-bold mb-6 text-center"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reg-name"
                className="block text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-1"
              >
                Nome Completo
              </label>
              <input
                id="reg-name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                placeholder="Ex.: Maria Oliveira"
              />
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-1"
              >
                E-mail
              </label>
              <input
                id="reg-email"
                type="email"
                required
                maxLength={150}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-1"
              >
                Senha (Mínimo 8 caracteres)
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 rounded shadow-md text-xs font-black tracking-widest uppercase text-black bg-amber-600 hover:bg-amber-500 focus:outline-none disabled:opacity-50 transition-colors mt-4"
            >
              {loading ? 'Criando conta...' : 'Cadastrar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs font-medium text-zinc-400">
            Já possui uma conta?{' '}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="text-amber-500 font-bold hover:text-amber-400 underline"
            >
              Acessar conta
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Cadastro() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500 font-bold uppercase text-xs">
          Carregando...
        </div>
      }
    >
      <CadastroForm />
    </Suspense>
  );
}
