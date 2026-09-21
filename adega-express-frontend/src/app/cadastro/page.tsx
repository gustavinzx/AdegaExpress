// src/app/cadastro/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const redirect = searchParams?.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Register
      
      // Front-end age validation (Extra layer of UX)
      const dateParts = birthDate.split('-');
      if (dateParts.length === 3) {
        const bd = new Date(`${birthDate}T00:00:00Z`);
        let age = new Date().getFullYear() - bd.getFullYear();
        const m = new Date().getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && new Date().getDate() < bd.getDate())) {
            age--;
        }
        if (age < 18) {
           setError('Você precisa ter 18 anos ou mais para se cadastrar e comprar bebidas.');
           setLoading(false);
           return;
        }
      }

      await api.post('/auth/register', { name, email, password, cpf, birth_date: birthDate });

      
      // 2. Auto Login after register
      const res = await api.post<{ token: string; user: any }>('/auth/login', { email, password });
      login(res.token, res.user);
      
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-[url('/hero-banner.jpg')] bg-cover bg-center">
      {/* Overlay Escuro */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      
      <div className="max-w-md w-full bg-white p-10 rounded-sm shadow-2xl relative z-10 border-t-4 border-amber-500 my-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logo.jpg" alt="Adega Cristal" className="w-16 h-16 rounded-full border-[3px] border-black shadow-lg mx-auto hover:scale-105 transition-transform" />
          </Link>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Crie sua conta</h2>
          <p className="text-gray-500 text-sm mt-1">Acesso exclusivo aos melhores produtos</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded text-sm font-bold mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="block w-full border border-gray-300 rounded px-4 py-2 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="João da Silva"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-1">CPF (Requerido 18+)</label>
            <input 
              type="text" 
              required
              maxLength={14}
              value={cpf}
              onChange={e => setCpf(e.target.value)}
              className="block w-full border border-gray-300 rounded px-4 py-2 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-1">Data de Nascimento (+18)</label>
            <input 
              type="date" 
              required
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="block w-full border border-gray-300 rounded px-4 py-2 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>


          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full border border-gray-300 rounded px-4 py-2 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-1">Senha (Mín. 6)</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full border border-gray-300 rounded px-4 py-2 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded shadow-md text-[11px] font-black tracking-widest uppercase text-white bg-amber-600 hover:bg-amber-700 focus:outline-none disabled:opacity-50 transition-colors mt-4"
          >
            {loading ? 'Aguarde...' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-8 text-center text-[13px] font-medium text-gray-600">
          Já tem conta?{' '}
          <Link href={`/login?redirect=${redirect}`} className="text-amber-600 font-bold hover:text-amber-700 hover:underline transition-colors">
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}
