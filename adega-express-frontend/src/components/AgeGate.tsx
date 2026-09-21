'use client';

import { useState, useEffect } from 'react';
import { cpf as cpfValidator } from 'cpf-cnpj-validator'; // Precisamos instalar isso no front tbm
import toast from 'react-hot-toast';

export default function AgeGate() {
  const [isOpen, setIsOpen] = useState(false);
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verified = localStorage.getItem('age_verified');
    if (!verified) {
      setIsOpen(true);
    }
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar CPF real
    if (!cpfValidator.isValid(cpf)) {
      setError('CPF inválido. Por favor, insira um CPF válido.');
      return;
    }

    // Validar Idade (+18)
    if (!birthDate) {
      setError('Data de nascimento é obrigatória.');
      return;
    }

    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    if (age < 18) {
      setError('Você precisa ter 18 anos ou mais para acessar o site.');
      return;
    }

    // Passou nas validações
    localStorage.setItem('age_verified', 'true');
    setIsOpen(false);
    toast.success('Idade verificada com sucesso!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-sm shadow-2xl relative">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black uppercase text-gray-900 mb-2">Você tem mais de 18 anos?</h2>
          <p className="text-gray-500 text-sm">Para acessar a Adega Express, confirme sua identidade.</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-bold mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">CPF</label>
            <input 
              type="text" 
              value={cpf}
              onChange={e => setCpf(e.target.value)}
              placeholder="000.000.000-00" 
              className="w-full border p-3 rounded outline-none focus:border-amber-500"
              maxLength={14}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data de Nascimento</label>
            <input 
              type="date" 
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="w-full border p-3 rounded outline-none focus:border-amber-500"
            />
          </div>
          <button type="submit" className="w-full bg-amber-600 text-white font-bold uppercase tracking-widest py-4 rounded hover:bg-amber-700 transition mt-2">
            Entrar no Site
          </button>
        </form>
        
        <p className="text-[10px] text-gray-400 text-center mt-6 uppercase tracking-wider">
          O consumo de bebidas alcoólicas é proibido para menores de 18 anos.
        </p>
      </div>
    </div>
  );
}
