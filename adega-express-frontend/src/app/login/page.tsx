// src/app/login/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { User } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      login(res.token, res.user);

      if (redirect) {
        router.push(redirect);
      } else if (res.user.role === 'ADMINISTRADOR' || res.user.role === 'ATENDENTE') {
        router.push('/admin');
      } else if (res.user.role === 'ENTREGADOR') {
        router.push('/entregador');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'E-mail ou senha inválidos.';
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
              Acessar Conta
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Autenticação para Clientes, Atendentes, Entregadores e Administradores
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
                htmlFor="login-email"
                className="block text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-1"
              >
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-[11px] font-black uppercase tracking-widest text-zinc-300 mb-1"
              >
                Senha
              </label>
              <input
                id="login-password"
                type="password"
                required
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
              {loading ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs font-medium text-zinc-400">
            Ainda não tem conta de cliente?{' '}
            <Link
              href={`/cadastro${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="text-amber-500 font-bold hover:text-amber-400 underline"
            >
              Cadastre-se
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500 font-bold uppercase text-xs">
          Carregando...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
