'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Address, Order } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User as UserIcon,
  MapPin,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Star,
  KeyRound,
} from 'lucide-react';
import toast from 'react-hot-toast';

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

function PerfilContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab');

  const [activeTab, setActiveTab] = useState<'DADOS' | 'ENDERECOS' | 'PEDIDOS'>(
    initialTab === 'ENDERECOS' || initialTab === 'PEDIDOS' ? initialTab : 'DADOS',
  );

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Address Form State
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addrForm, setAddrForm] = useState({
    zip: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'Brasília',
    state: 'DF',
    is_default: false,
  });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (activeTab === 'ENDERECOS' && user.role === 'CLIENTE') {
        const res = await api.get<Address[]>('/addresses');
        setAddresses(res);
      } else if (activeTab === 'PEDIDOS' && user.role === 'CLIENTE') {
        const res = await api.getPaginated<Order[]>('/orders/me');
        setOrders(res.data || []);
      }
    } catch {
      // Ignora erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/perfil');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      void fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setAddrForm({
      zip: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: 'Brasília',
      state: 'DF',
      is_default: addresses.length === 0,
    });
    setShowAddrForm(true);
  };

  const openEditAddressForm = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrForm({
      zip: addr.zip,
      street: addr.street,
      number: addr.number,
      complement: addr.complement || '',
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      is_default: addr.is_default,
    });
    setShowAddrForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanZip = addrForm.zip.replace(/\D/g, '');
      if (cleanZip.length !== 8) {
        toast.error('Informe um CEP válido com 8 dígitos.');
        return;
      }
      const formattedZip = `${cleanZip.slice(0, 5)}-${cleanZip.slice(5)}`;

      const payload = {
        street: addrForm.street.trim(),
        number: addrForm.number.trim(),
        complement: addrForm.complement.trim() || null,
        neighborhood: addrForm.neighborhood.trim(),
        city: addrForm.city.trim(),
        state: addrForm.state,
        zip: formattedZip,
        is_default: addrForm.is_default,
      };

      if (editingAddressId) {
        await api.put(`/addresses/${editingAddressId}`, payload);
        toast.success('Endereço atualizado com sucesso!');
      } else {
        await api.post('/addresses', payload);
        toast.success('Endereço cadastrado com sucesso!');
      }

      setShowAddrForm(false);
      setEditingAddressId(null);
      await fetchData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erro ao salvar endereço.';
      toast.error(errorMessage);
    }
  };

  const handleSetDefaultAddress = async (addr: Address) => {
    try {
      await api.put(`/addresses/${addr.id}`, { is_default: true });
      toast.success('Definido como endereço padrão!');
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao definir endereço padrão.';
      toast.error(msg);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Endereço arquivado com sucesso.');
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao remover endereço.';
      toast.error(msg);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setChangingPass(true);
      await api.patch('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Senha alterada com sucesso! Faça login novamente.');
      setCurrentPassword('');
      setNewPassword('');
      await logout();
      router.push('/login');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar senha.';
      toast.error(msg);
    } finally {
      setChangingPass(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 border-b border-slate-200 pb-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
            Painel do Usuário
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-0.5">
            Meu Perfil
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation (3 cols) */}
          <div className="lg:col-span-3 space-y-2">
            <button
              onClick={() => setActiveTab('DADOS')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'DADOS'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <UserIcon size={16} /> Meus Dados &amp; Senha
            </button>

            {user.role === 'CLIENTE' && (
              <>
                <button
                  onClick={() => setActiveTab('ENDERECOS')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'ENDERECOS'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <MapPin size={16} /> Meus Endereços
                </button>
                <button
                  onClick={() => setActiveTab('PEDIDOS')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'PEDIDOS'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <ShoppingBag size={16} /> Meus Pedidos
                </button>
              </>
            )}
          </div>

          {/* Main Area (9 cols) */}
          <div className="lg:col-span-9">
            {activeTab === 'DADOS' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                    Informações Pessoais
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">Nome</span>
                      <p className="font-bold text-slate-900">{user.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">E-mail</span>
                      <p className="font-bold text-slate-900">{user.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block mb-1">Perfil de Acesso</span>
                      <span className="inline-block bg-teal-50 border border-teal-200 text-teal-800 font-bold px-2.5 py-0.5 rounded-md uppercase text-[10px]">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <KeyRound size={17} className="text-teal-700" />
                    <span>Segurança &amp; Senha</span>
                  </h2>

                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Senha Atual
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Nova Senha (mín. 8 caracteres)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={changingPass}
                      className="h-10 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {changingPass ? 'Alterando...' : 'Salvar Nova Senha'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Endereços de Entrega (T07_enderecos) */}
            {activeTab === 'ENDERECOS' && (
              <div>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-6 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Endereços de Entrega
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gerencie seus locais de entrega para agilizar o checkout.
                    </p>
                  </div>
                  <button
                    onClick={openNewAddressForm}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                  >
                    <Plus size={14} /> Novo Endereço
                  </button>
                </div>

                {showAddrForm && (
                  <form
                    onSubmit={handleSaveAddress}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-base text-slate-900">
                        {editingAddressId ? 'Editar Endereço' : 'Cadastrar Novo Endereço'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddrForm(false);
                          setEditingAddressId(null);
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          CEP (00000-000)
                        </label>
                        <input
                          required
                          placeholder="70000-000"
                          value={addrForm.zip}
                          onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value })}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Rua / Logradouro
                        </label>
                        <input
                          required
                          placeholder="Rua das Palmeiras"
                          value={addrForm.street}
                          onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Número
                        </label>
                        <input
                          required
                          placeholder="123"
                          value={addrForm.number}
                          onChange={(e) => setAddrForm({ ...addrForm, number: e.target.value })}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Complemento (Opcional)
                        </label>
                        <input
                          placeholder="Apto, Bloco..."
                          value={addrForm.complement}
                          onChange={(e) => setAddrForm({ ...addrForm, complement: e.target.value })}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Bairro
                        </label>
                        <input
                          required
                          placeholder="Centro"
                          value={addrForm.neighborhood}
                          onChange={(e) =>
                            setAddrForm({ ...addrForm, neighborhood: e.target.value })
                          }
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Cidade
                        </label>
                        <input
                          required
                          placeholder="Brasília"
                          value={addrForm.city}
                          onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          UF
                        </label>
                        <select
                          value={addrForm.state}
                          onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                        >
                          {UF_LIST.map((uf) => (
                            <option key={uf} value={uf}>
                              {uf}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-600 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addrForm.is_default}
                        onChange={(e) =>
                          setAddrForm({ ...addrForm, is_default: e.target.checked })
                        }
                        className="accent-teal-700"
                      />
                      <span>Definir como meu endereço padrão de entrega</span>
                    </label>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="h-10 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                      >
                        {editingAddressId ? 'Salvar Alterações' : 'Salvar Endereço'}
                      </button>
                    </div>
                  </form>
                )}

                {loading ? (
                  <p className="text-slate-500 text-xs">Carregando endereços...</p>
                ) : addresses.length === 0 ? (
                  <p className="text-slate-500 text-xs">Nenhum endereço cadastrado.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                          addr.is_default
                            ? 'bg-teal-50/50 border-teal-300 ring-1 ring-teal-300'
                            : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-sm text-slate-900">
                              {addr.street}, {addr.number}
                            </span>
                            {addr.is_default && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md uppercase">
                                <Star size={10} /> Padrão
                              </span>
                            )}
                          </div>
                          {addr.complement && (
                            <p className="text-xs text-slate-500">{addr.complement}</p>
                          )}
                          <p className="text-xs text-slate-500">
                            {addr.neighborhood} — {addr.city}/{addr.state}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-1">CEP {addr.zip}</p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                          {!addr.is_default && (
                            <button
                              type="button"
                              onClick={() => void handleSetDefaultAddress(addr)}
                              className="text-xs text-teal-700 hover:underline font-bold cursor-pointer"
                            >
                              Tornar padrão
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditAddressForm(addr)}
                            className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-teal-700 font-semibold cursor-pointer"
                          >
                            <Edit2 size={12} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteAddress(addr.id)}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                          >
                            <Trash2 size={12} /> Arquivar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pedidos */}
            {activeTab === 'PEDIDOS' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
                  <h2 className="text-xl font-extrabold text-slate-900">Histórico de Pedidos</h2>
                  <span className="text-xs text-slate-500">{orders.length} pedidos encontrados</span>
                </div>

                {orders.length === 0 ? (
                  <p className="text-slate-500 text-xs">Você ainda não realizou nenhum pedido.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div
                        key={o.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold text-slate-900 text-sm">
                              Pedido #{o.id}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(o.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Total: <strong className="text-slate-900">R$ {parseFloat(o.total).toFixed(2).replace('.', ',')}</strong> • Pagamento: {o.payment_method}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                            {o.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => router.push(`/pedidos/${o.id}`)}
                            className="text-xs font-bold text-teal-700 hover:underline"
                          >
                            Ver Detalhes →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Perfil() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-teal-700 border-t-transparent animate-spin" />
        </div>
      }
    >
      <PerfilContent />
    </Suspense>
  );
}
