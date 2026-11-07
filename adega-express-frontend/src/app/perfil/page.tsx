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
  CheckCircle,
  Edit2,
  Star,
  KeyRound,
  Info,
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

  // Address Form State (Create & Edit - UC14)
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addrForm, setAddrForm] = useState({
    zip: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar dados.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/perfil');
      return;
    }
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, activeTab, router]);

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setAddrForm({
      zip: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: 'SP',
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
      setLoading(true);
      const payload: Record<string, unknown> = {
        zip: addrForm.zip.trim(),
        street: addrForm.street.trim(),
        number: addrForm.number.trim(),
        neighborhood: addrForm.neighborhood.trim(),
        city: addrForm.city.trim(),
        state: addrForm.state.trim().toUpperCase(),
        is_default: addrForm.is_default,
      };
      if (addrForm.complement.trim()) {
        payload.complement = addrForm.complement.trim();
      } else {
        payload.complement = null;
      }

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
      const msg = e instanceof Error ? e.message : 'Erro ao salvar endereço.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addr: Address) => {
    try {
      setLoading(true);
      await api.put(`/addresses/${addr.id}`, {
        street: addr.street,
        number: addr.number,
        complement: addr.complement || null,
        neighborhood: addr.neighborhood,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        is_default: true,
      });
      toast.success('Endereço definido como padrão!');
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao definir endereço padrão.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveAddress = async (id: number) => {
    if (!confirm('Deseja arquivar este endereço? Os pedidos históricos serão preservados.')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Endereço arquivado com sucesso.');
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao arquivar endereço.';
      toast.error(msg);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setChangingPass(true);
      await api.patch('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Senha alterada com sucesso! Faça login novamente.');
      await logout();
      router.push('/login');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao alterar senha.';
      toast.error(msg);
    } finally {
      setChangingPass(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="bg-zinc-950 min-h-screen font-sans text-white pb-20">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-0.5 w-10 bg-amber-500" />
          <h1 className="text-2xl md:text-3xl font-serif font-black text-white uppercase tracking-wider">
            Minha Conta
          </h1>
          <div className="h-0.5 flex-1 bg-zinc-800" />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* SIDEBAR TABS */}
          <aside className="w-full md:w-64 space-y-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('DADOS')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg font-bold transition-all uppercase tracking-widest text-xs border ${
                activeTab === 'DADOS'
                  ? 'bg-amber-600 text-black border-amber-500'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <UserIcon size={16} /> Meus Dados & Senha
            </button>

            {user.role === 'CLIENTE' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('ENDERECOS')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg font-bold transition-all uppercase tracking-widest text-xs border ${
                    activeTab === 'ENDERECOS'
                      ? 'bg-amber-600 text-black border-amber-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <MapPin size={16} /> Meus Endereços
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('PEDIDOS')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg font-bold transition-all uppercase tracking-widest text-xs border ${
                    activeTab === 'PEDIDOS'
                      ? 'bg-amber-600 text-black border-amber-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <ShoppingBag size={16} /> Meus Pedidos
                </button>
              </>
            )}
          </aside>

          {/* CONTENT AREA */}
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 shadow-xl">
            {loading && activeTab !== 'DADOS' && (
              <div className="text-center py-12 text-amber-500 font-black tracking-widest uppercase animate-pulse text-xs">
                Carregando dados...
              </div>
            )}

            {/* ABA DADOS E SENHA */}
            {activeTab === 'DADOS' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-white mb-4">
                    Informações da Conta
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                        Nome Completo
                      </p>
                      <p className="font-bold text-base text-white">{user.name}</p>
                    </div>
                    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                        E-mail
                      </p>
                      <p className="font-bold text-base text-white">{user.email}</p>
                    </div>
                    <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 sm:col-span-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                        Perfil de Acesso
                      </p>
                      <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded text-xs font-black uppercase">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trocar Senha */}
                <div className="pt-6 border-t border-zinc-800">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                    <KeyRound size={16} className="text-amber-500" /> Alterar Senha de Acesso
                  </h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label
                        htmlFor="curr-pass"
                        className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                      >
                        Senha Atual
                      </label>
                      <input
                        id="curr-pass"
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="new-pass"
                        className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                      >
                        Nova Senha (mín. 8 caracteres)
                      </label>
                      <input
                        id="new-pass"
                        type="password"
                        required
                        minLength={8}
                        maxLength={72}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={changingPass}
                      className="bg-zinc-800 hover:bg-amber-600 hover:text-black text-white font-black uppercase tracking-widest text-xs px-5 py-2.5 rounded border border-zinc-700 transition-colors disabled:opacity-50"
                    >
                      {changingPass ? 'Atualizando...' : 'Atualizar Senha'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ABA ENDEREÇOS (UC14 / RF21 / RN10) */}
            {!loading && activeTab === 'ENDERECOS' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-wider text-white">
                      Meus Endereços de Entrega
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Cadastre, edite, defina um endereço padrão ou arquive endereços antigos (UC14).
                    </p>
                  </div>
                  {!showAddrForm && (
                    <button
                      type="button"
                      onClick={openNewAddressForm}
                      className="bg-amber-600 hover:bg-amber-500 text-black text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded flex items-center gap-1.5 transition-colors self-start"
                    >
                      <Plus size={14} /> Novo Endereço
                    </button>
                  )}
                </div>

                {showAddrForm ? (
                  <form
                    onSubmit={handleSaveAddress}
                    className="bg-zinc-950 p-5 rounded-lg border border-zinc-800 space-y-4 mb-6"
                  >
                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">
                      {editingAddressId ? 'Editar Endereço' : 'Cadastrar Novo Endereço'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="addr-zip"
                          className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                        >
                          CEP (00000-000)
                        </label>
                        <input
                          id="addr-zip"
                          required
                          pattern="\d{5}-?\d{3}"
                          value={addrForm.zip}
                          onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                          placeholder="01001-000"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="addr-state"
                          className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                        >
                          UF (Estado)
                        </label>
                        <select
                          id="addr-state"
                          value={addrForm.state}
                          onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                        >
                          {UF_LIST.map((uf) => (
                            <option key={uf} value={uf}>
                              {uf}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label
                          htmlFor="addr-street"
                          className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                        >
                          Logradouro (Rua / Avenida)
                        </label>
                        <input
                          id="addr-street"
                          required
                          value={addrForm.street}
                          onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="addr-number"
                          className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                        >
                          Número
                        </label>
                        <input
                          id="addr-number"
                          required
                          value={addrForm.number}
                          onChange={(e) => setAddrForm({ ...addrForm, number: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="addr-complement"
                          className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                        >
                          Complemento (Opcional)
                        </label>
                        <input
                          id="addr-complement"
                          value={addrForm.complement}
                          onChange={(e) => setAddrForm({ ...addrForm, complement: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                          placeholder="Apto, Bloco, Casa..."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="addr-neighborhood"
                          className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                        >
                          Bairro
                        </label>
                        <input
                          id="addr-neighborhood"
                          required
                          value={addrForm.neighborhood}
                          onChange={(e) =>
                            setAddrForm({ ...addrForm, neighborhood: e.target.value })
                          }
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="addr-city"
                          className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1"
                        >
                          Cidade
                        </label>
                        <input
                          id="addr-city"
                          required
                          value={addrForm.city}
                          onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={addrForm.is_default}
                        onChange={(e) =>
                          setAddrForm({ ...addrForm, is_default: e.target.checked })
                        }
                        className="accent-amber-500"
                      />
                      Definir como endereço padrão para o checkout
                    </label>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddrForm(false);
                          setEditingAddressId(null);
                        }}
                        className="flex-1 bg-transparent border border-zinc-700 text-white font-bold py-2.5 rounded text-xs uppercase hover:bg-zinc-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest py-2.5 rounded text-xs disabled:opacity-50"
                      >
                        {editingAddressId ? 'Salvar Alterações' : 'Cadastrar Endereço'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {addresses.length === 0 ? (
                      <div className="text-center py-10 bg-zinc-950 border border-zinc-800 rounded-lg">
                        <p className="text-zinc-400 text-xs">
                          Nenhum endereço ativo cadastrado.
                        </p>
                      </div>
                    ) : (
                      addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            {addr.is_default && (
                              <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded mb-1.5 uppercase">
                                <Star size={11} /> Endereço Padrão
                              </span>
                            )}
                            <p className="font-bold text-white text-sm">
                              {addr.street}, {addr.number}{' '}
                              {addr.complement ? `— ${addr.complement}` : ''}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {addr.neighborhood}, {addr.city} - {addr.state} • CEP: {addr.zip}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!addr.is_default && (
                              <button
                                type="button"
                                onClick={() => void handleSetDefaultAddress(addr)}
                                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-amber-500 hover:text-amber-400 transition-colors"
                              >
                                Tornar Padrão
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditAddressForm(addr)}
                              className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-500 transition-colors"
                              title="Editar endereço"
                              aria-label="Editar endereço"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleArchiveAddress(addr.id)}
                              className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                              title="Arquivar endereço"
                              aria-label="Arquivar endereço"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ABA PEDIDOS (UC05) */}
            {!loading && activeTab === 'PEDIDOS' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-black uppercase tracking-wider text-white">
                    Meus Pedidos Recentes
                  </h2>
                  <button
                    type="button"
                    onClick={() => router.push('/pedidos')}
                    className="text-xs font-bold text-amber-500 hover:underline"
                  >
                    Ver página completa de acompanhamento →
                  </button>
                </div>

                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-10 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <p className="text-zinc-400 text-xs mb-4">
                        Você ainda não realizou nenhum pedido.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/#catalogo')}
                        className="bg-amber-600 text-black font-black text-xs uppercase px-6 py-2.5 rounded hover:bg-amber-500"
                      >
                        Explorar Catálogo
                      </button>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-zinc-950 p-5 rounded-lg border border-zinc-800 shadow-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-xs font-black text-white uppercase">
                              Pedido #{order.id}
                            </span>
                            <p className="text-[11px] text-zinc-500">
                              {new Date(order.created_at).toLocaleString('pt-BR')}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="bg-zinc-800 text-amber-400 text-[10px] font-black uppercase px-2.5 py-1 rounded">
                                Status: {order.status}
                              </span>
                              {order.payment_status === 'PAGO' ? (
                                <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-1 rounded flex items-center gap-1">
                                  <CheckCircle size={11} /> Pagamento Demonstrativo: PAGO
                                </span>
                              ) : (
                                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase px-2.5 py-1 rounded">
                                  Pagamento Demonstrativo: {order.payment_status}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-amber-500">
                              R$ {Number(order.total).toFixed(2).replace('.', ',')}
                            </span>
                            <p className="text-[10px] text-zinc-400 uppercase mt-0.5">
                              Modalidade: {order.payment_method} (Simulado)
                            </p>
                          </div>
                        </div>

                        {order.payment_status === 'PENDENTE' && order.status === 'PENDENTE' && (
                          <div className="mb-3 bg-zinc-900 border border-zinc-800 rounded p-2.5 text-[11px] text-zinc-300 flex items-center gap-2">
                            <Info size={14} className="text-amber-500 shrink-0" />
                            <span>
                              Aguardando conferência manual do pagamento demonstrativo por Atendente ou Administrador (prazo de 30 minutos — RN07).
                            </span>
                          </div>
                        )}

                        <div className="border-t border-zinc-800 pt-3">
                          <p className="text-[10px] text-zinc-500 mb-1.5 font-black uppercase tracking-widest">
                            Itens do Pedido:
                          </p>
                          {order.items?.map((item) => (
                            <p key={item.id} className="text-xs text-zinc-300">
                              <span className="font-bold text-white">{item.quantity}x</span>{' '}
                              {item.product_name} — R${' '}
                              {Number(item.unit_price).toFixed(2).replace('.', ',')}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500 font-bold uppercase text-xs">
          Carregando perfil...
        </div>
      }
    >
      <PerfilContent />
    </Suspense>
  );
}
