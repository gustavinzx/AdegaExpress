'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import toast from 'react-hot-toast';

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

      toast.success('Conta criada com sucesso!');
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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link href="/" className="mb-6 flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="Adega Express"
            className="w-16 h-16 rounded-full border border-amber-500 object-cover"
          />
          <span className="text-xl font-serif font-black uppercase tracking-wider">
            Adega<span className="text-amber-500">Express</span>
          </span>
        </Link>
        <h1 className="text-2xl font-serif font-black text-white uppercase tracking-wider">
          Criar Conta
        </h1>
        <p className="mt-2 text-xs text-zinc-400">
          Já possui cadastro?{' '}
          <Link href="/login" className="text-amber-500 hover:underline font-bold">
            Fazer login
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-6 shadow-2xl rounded-xl border border-zinc-800 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Senha (mínimo de 8 caracteres)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Cadastrando...' : 'Concluir Cadastro'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
