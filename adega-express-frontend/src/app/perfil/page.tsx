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
    city: 'São Paulo',
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
      city: 'São Paulo',
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
      const digits = addrForm.zip.replace(/\D/g, '');
      if (digits.length !== 8) {
        toast.error('O CEP deve conter 8 dígitos (ex.: 01001-000).');
        return;
      }
      const formattedZip = `${digits.slice(0, 5)}-${digits.slice(5)}`;
      const payload = {
        zip: formattedZip,
        street: addrForm.street.trim(),
        number: addrForm.number.trim(),
        complement: addrForm.complement.trim() || undefined,
        neighborhood: addrForm.neighborhood.trim(),
        city: addrForm.city.trim(),
        state: addrForm.state,
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
      toast.success('Endereço arquivado (preservado no histórico de pedidos — RN10).');
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
    <div className="bg-[#0e0c0a] min-h-screen font-sans text-[#f4efe6]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 border-b border-[#c9a256]/15 pb-6">
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#c9a256]">
            Conta Pessoal &amp; Endereços • UC14
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#f4efe6] mt-1">
            Meu Perfil
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation (3 cols) */}
          <div className="lg:col-span-3 space-y-2">
            <button
              onClick={() => setActiveTab('DADOS')}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer ${
                activeTab === 'DADOS'
                  ? 'bg-[#c9a256] text-[#0e0c0a] shadow-[0_8px_25px_rgba(201,162,86,0.25)]'
                  : 'bg-[#14110e] text-[#9e9589] hover:text-[#f4efe6] border border-[#c9a256]/15'
              }`}
            >
              <UserIcon size={17} /> Meus Dados &amp; Senha
            </button>

            {user.role === 'CLIENTE' && (
              <>
                <button
                  onClick={() => setActiveTab('ENDERECOS')}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer ${
                    activeTab === 'ENDERECOS'
                      ? 'bg-[#c9a256] text-[#0e0c0a] shadow-[0_8px_25px_rgba(201,162,86,0.25)]'
                      : 'bg-[#14110e] text-[#9e9589] hover:text-[#f4efe6] border border-[#c9a256]/15'
                  }`}
                >
                  <MapPin size={17} /> Meus Endereços
                </button>
                <button
                  onClick={() => setActiveTab('PEDIDOS')}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer ${
                    activeTab === 'PEDIDOS'
                      ? 'bg-[#c9a256] text-[#0e0c0a] shadow-[0_8px_25px_rgba(201,162,86,0.25)]'
                      : 'bg-[#14110e] text-[#9e9589] hover:text-[#f4efe6] border border-[#c9a256]/15'
                  }`}
                >
                  <ShoppingBag size={17} /> Resumo de Pedidos
                </button>
              </>
            )}
          </div>

          {/* Content Area (9 cols) */}
          <div className="lg:col-span-9 bg-[#14110e] border border-[#c9a256]/20 rounded-3xl p-6 sm:p-10 shadow-2xl">
            {activeTab === 'DADOS' && (
              <div className="space-y-10 max-w-xl">
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-[#f4efe6] mb-6 border-b border-[#c9a256]/15 pb-3">
                    Dados da Conta
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1.5">
                        Nome Completo
                      </label>
                      <input
                        disabled
                        value={user.name}
                        className="w-full h-11 bg-[#0e0c0a] border border-[#c9a256]/15 rounded-xl px-4 text-sm text-[#f4efe6]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1.5">
                        E-mail
                      </label>
                      <input
                        disabled
                        value={user.email}
                        className="w-full h-11 bg-[#0e0c0a] border border-[#c9a256]/15 rounded-xl px-4 text-sm text-[#f4efe6]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1.5">
                        Perfil de Acesso
                      </label>
                      <span className="inline-block bg-[#c9a256]/15 text-[#c9a256] border border-[#c9a256]/35 font-mono text-xs px-4 py-1.5 rounded-full uppercase tracking-widest">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <form
                  onSubmit={handleChangePassword}
                  className="pt-6 border-t border-[#c9a256]/15 space-y-4"
                >
                  <h3 className="font-serif text-2xl font-semibold text-[#f4efe6] flex items-center gap-2">
                    <KeyRound size={18} className="text-[#c9a256]" /> Alterar Senha de Acesso
                  </h3>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1.5">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full h-11 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-4 text-sm text-[#f4efe6] focus:outline-none focus:border-[#c9a256]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1.5">
                      Nova Senha (mínimo 8 caracteres)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-11 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl px-4 text-sm text-[#f4efe6] focus:outline-none focus:border-[#c9a256]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={changingPass}
                    className="h-11 px-6 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.16em] transition-all cursor-pointer"
                  >
                    {changingPass ? 'Atualizando...' : 'Atualizar Senha'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'ENDERECOS' && (
              <div>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-[#c9a256]/15 pb-4">
                  <div>
                    <h2 className="font-serif text-3xl font-semibold text-[#f4efe6]">
                      Endereços de Entrega (UC14)
                    </h2>
                    <p className="text-xs text-[#9e9589] mt-1">
                      Endereços utilizados em pedidos anteriores são preservados no histórico
                      (RN10).
                    </p>
                  </div>
                  <button
                    onClick={openNewAddressForm}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.14em] transition-all cursor-pointer"
                  >
                    <Plus size={15} /> Novo Endereço
                  </button>
                </div>

                {showAddrForm && (
                  <form
                    onSubmit={handleSaveAddress}
                    className="bg-[#0e0c0a] p-6 rounded-2xl border border-[#c9a256]/30 mb-8 space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-[#c9a256]/15 pb-3">
                      <h3 className="font-serif text-xl font-semibold text-[#c9a256]">
                        {editingAddressId ? 'Editar Endereço' : 'Cadastrar Novo Endereço'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddrForm(false);
                          setEditingAddressId(null);
                        }}
                        className="text-xs text-[#9e9589] hover:text-[#f4efe6]"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1">
                          CEP (00000-000)
                        </label>
                        <input
                          required
                          placeholder="01001-000"
                          value={addrForm.zip}
                          onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value })}
                          className="w-full h-11 bg-[#14110e] border border-[#c9a256]/20 rounded-xl px-3.5 text-sm text-[#f4efe6]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1">
                          Rua / Logradouro
                        </label>
                        <input
                          required
                          placeholder="Av. Paulista"
                          value={addrForm.street}
                          onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                          className="w-full h-11 bg-[#14110e] border border-[#c9a256]/20 rounded-xl px-3.5 text-sm text-[#f4efe6]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1">
                          Número
                        </label>
                        <input
                          required
                          placeholder="1000"
                          value={addrForm.number}
                          onChange={(e) => setAddrForm({ ...addrForm, number: e.target.value })}
                          className="w-full h-11 bg-[#14110e] border border-[#c9a256]/20 rounded-xl px-3.5 text-sm text-[#f4efe6]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1">
                          Complemento (Opcional)
                        </label>
                        <input
                          placeholder="Apto, Bloco..."
                          value={addrForm.complement}
                          onChange={(e) => setAddrForm({ ...addrForm, complement: e.target.value })}
                          className="w-full h-11 bg-[#14110e] border border-[#c9a256]/20 rounded-xl px-3.5 text-sm text-[#f4efe6]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1">
                          Bairro
                        </label>
                        <input
                          required
                          placeholder="Bela Vista"
                          value={addrForm.neighborhood}
                          onChange={(e) =>
                            setAddrForm({ ...addrForm, neighborhood: e.target.value })
                          }
                          className="w-full h-11 bg-[#14110e] border border-[#c9a256]/20 rounded-xl px-3.5 text-sm text-[#f4efe6]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1">
                          Cidade
                        </label>
                        <input
                          required
                          placeholder="São Paulo"
                          value={addrForm.city}
                          onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                          className="w-full h-11 bg-[#14110e] border border-[#c9a256]/20 rounded-xl px-3.5 text-sm text-[#f4efe6]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-1">
                          UF
                        </label>
                        <select
                          value={addrForm.state}
                          onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                          className="w-full h-11 bg-[#14110e] border border-[#c9a256]/20 rounded-xl px-3 text-sm text-[#f4efe6]"
                        >
                          {UF_LIST.map((uf) => (
                            <option key={uf} value={uf}>
                              {uf}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-[#9e9589] pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addrForm.is_default}
                        onChange={(e) =>
                          setAddrForm({ ...addrForm, is_default: e.target.checked })
                        }
                        className="accent-[#c9a256]"
                      />
                      Definir como meu endereço padrão de entrega
                    </label>

                    <div className="flex justify-end pt-3">
                      <button
                        type="submit"
                        className="h-11 px-6 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.16em] transition-all cursor-pointer"
                      >
                        {editingAddressId ? 'Salvar Alterações' : 'Salvar Endereço'}
                      </button>
                    </div>
                  </form>
                )}

                {loading ? (
                  <p className="text-[#9e9589] text-sm">Carregando endereços...</p>
                ) : addresses.length === 0 ? (
                  <p className="text-[#9e9589] text-sm">Nenhum endereço cadastrado.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                          addr.is_default
                            ? 'bg-[#1c1712] border-[#c9a256]/50'
                            : 'bg-[#0e0c0a] border-[#c9a256]/15'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-serif text-lg font-semibold text-[#f4efe6]">
                              {addr.street}, {addr.number}
                            </span>
                            {addr.is_default && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-[#c9a256]/20 text-[#c9a256] px-2.5 py-0.5 rounded-full uppercase">
                                <Star size={10} /> Padrão
                              </span>
                            )}
                          </div>
                          {addr.complement && (
                            <p className="text-xs text-[#9e9589]">{addr.complement}</p>
                          )}
                          <p className="text-xs text-[#9e9589]">
                            {addr.neighborhood} — {addr.city}/{addr.state}
                          </p>
                          <p className="text-xs text-[#9e9589]/70 font-mono mt-1">CEP {addr.zip}</p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#c9a256]/10">
                          {!addr.is_default && (
                            <button
                              type="button"
                              onClick={() => void handleSetDefaultAddress(addr)}
                              className="text-xs text-[#c9a256] hover:underline font-medium cursor-pointer"
                            >
                              Tornar padrão
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditAddressForm(addr)}
                            className="inline-flex items-center gap-1 text-xs text-[#f4efe6] hover:text-[#c9a256] font-medium cursor-pointer"
                          >
                            <Edit2 size={13} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteAddress(addr.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                          >
                            <Trash2 size={13} /> Arquivar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'PEDIDOS' && (
              <div>
                <h2 className="font-serif text-3xl font-semibold text-[#f4efe6] mb-4 border-b border-[#c9a256]/15 pb-3">
                  Pedidos Recentes (UC05)
                </h2>
                <div className="mb-6 rounded-2xl border border-[#c9a256]/25 bg-[#0e0c0a] p-4 flex items-center gap-3 text-xs text-[#9e9589]">
                  <Info size={16} className="text-[#c9a256] shrink-0" />
                  <span>
                    O pagamento registrado é estritamente demonstrativo (sem cobrança real). A
                    confirmação é feita manualmente por um Atendente ou Administrador (RN08).
                  </span>
                </div>

                {loading ? (
                  <p className="text-[#9e9589] text-sm">Carregando pedidos...</p>
                ) : orders.length === 0 ? (
                  <p className="text-[#9e9589] text-sm">Você ainda não realizou nenhum pedido.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-[#0e0c0a] p-5 rounded-2xl border border-[#c9a256]/15 flex flex-wrap justify-between items-center gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono font-bold text-[#c9a256]">
                              Pedido #{order.id}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-[#1c1814] text-[#f4efe6] border border-[#c9a256]/20">
                              {order.status}
                            </span>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${
                                order.payment_status === 'PAGO'
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-950/50 text-[#c9a256] border border-[#c9a256]/30'
                              }`}
                            >
                              {order.payment_method}: {order.payment_status}
                            </span>
                          </div>
                          <p className="text-xs text-[#9e9589]">
                            {new Date(order.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xl font-bold text-[#f4efe6]">
                            R$ {parseFloat(order.total).toFixed(2).replace('.', ',')}
                          </span>
                          {order.payment_status === 'PAGO' && (
                            <span className="text-emerald-400 flex items-center gap-1 text-xs font-semibold uppercase">
                              <CheckCircle size={15} /> Confirmado
                            </span>
                          )}
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
        <div className="min-h-screen bg-[#0e0c0a] text-[#c9a256] flex items-center justify-center font-serif text-2xl">
          Carregando perfil...
        </div>
      }
    >
      <PerfilContent />
    </Suspense>
  );
}
