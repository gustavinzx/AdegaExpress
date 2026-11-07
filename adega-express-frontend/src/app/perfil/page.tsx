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
        toast.success('Endereço atualizado!');
      } else {
        await api.post('/addresses', payload);
        toast.success('Endereço cadastrado!');
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
      toast.success('Endereço removido.');
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
      toast.success('Senha alterada! Faça login novamente.');
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
    <div className="bg-zinc-950 min-h-screen font-sans text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-serif font-black uppercase tracking-wider mb-8 border-b border-zinc-800 pb-4">
          Minha Conta
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-2">
            <button
              onClick={() => setActiveTab('DADOS')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'DADOS'
                  ? 'bg-amber-600 text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <UserIcon size={16} /> Meus Dados
            </button>

            {user.role === 'CLIENTE' && (
              <>
                <button
                  onClick={() => setActiveTab('ENDERECOS')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === 'ENDERECOS'
                      ? 'bg-amber-600 text-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <MapPin size={16} /> Endereços
                </button>
                <button
                  onClick={() => setActiveTab('PEDIDOS')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeTab === 'PEDIDOS'
                      ? 'bg-amber-600 text-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <ShoppingBag size={16} /> Pedidos
                </button>
              </>
            )}
          </div>

          <div className="lg:col-span-9 bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
            {activeTab === 'DADOS' && (
              <div className="space-y-8 max-w-lg">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-wider text-amber-500 mb-4 border-b border-zinc-800 pb-2">
                    Informações Pessoais
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Nome
                      </label>
                      <input
                        disabled
                        value={user.name}
                        className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        E-mail
                      </label>
                      <input
                        disabled
                        value={user.email}
                        className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleChangePassword}
                  className="pt-6 border-t border-zinc-800 space-y-4"
                >
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                    <KeyRound size={15} /> Alterar Senha
                  </h3>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={changingPass}
                    className="h-10 px-6 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    {changingPass ? 'Salvando...' : 'Atualizar Senha'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'ENDERECOS' && (
              <div>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold uppercase tracking-wider text-amber-500">
                    Meus Endereços
                  </h2>
                  <button
                    onClick={openNewAddressForm}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <Plus size={14} /> Novo Endereço
                  </button>
                </div>

                {showAddrForm && (
                  <form
                    onSubmit={handleSaveAddress}
                    className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 mb-6 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                          CEP
                        </label>
                        <input
                          required
                          placeholder="01001-000"
                          value={addrForm.zip}
                          onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value })}
                          className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                          Rua
                        </label>
                        <input
                          required
                          placeholder="Av. Paulista"
                          value={addrForm.street}
                          onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                          className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                          Número
                        </label>
                        <input
                          required
                          placeholder="1000"
                          value={addrForm.number}
                          onChange={(e) => setAddrForm({ ...addrForm, number: e.target.value })}
                          className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                          Complemento
                        </label>
                        <input
                          placeholder="Apto, Bloco..."
                          value={addrForm.complement}
                          onChange={(e) => setAddrForm({ ...addrForm, complement: e.target.value })}
                          className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                          Bairro
                        </label>
                        <input
                          required
                          value={addrForm.neighborhood}
                          onChange={(e) =>
                            setAddrForm({ ...addrForm, neighborhood: e.target.value })
                          }
                          className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                          Cidade
                        </label>
                        <input
                          required
                          value={addrForm.city}
                          onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                          className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                          UF
                        </label>
                        <select
                          value={addrForm.state}
                          onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                          className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-white"
                        >
                          {UF_LIST.map((uf) => (
                            <option key={uf} value={uf}>
                              {uf}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addrForm.is_default}
                          onChange={(e) =>
                            setAddrForm({ ...addrForm, is_default: e.target.checked })
                          }
                          className="accent-amber-500"
                        />
                        Endereço padrão
                      </label>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddrForm(false)}
                          className="h-9 px-4 rounded bg-zinc-800 text-xs text-zinc-300 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="h-9 px-5 rounded bg-amber-600 text-black font-bold text-xs uppercase cursor-pointer"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {loading ? (
                  <p className="text-zinc-400 text-xs">Carregando...</p>
                ) : addresses.length === 0 ? (
                  <p className="text-zinc-400 text-xs">Nenhum endereço cadastrado.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          addr.is_default
                            ? 'bg-zinc-950 border-amber-500/60'
                            : 'bg-zinc-950 border-zinc-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-white">
                              {addr.street}, {addr.number}
                            </span>
                            {addr.is_default && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase">
                                <Star size={10} /> Padrão
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">
                            {addr.neighborhood} — {addr.city}/{addr.state}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">CEP {addr.zip}</p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                          {!addr.is_default && (
                            <button
                              type="button"
                              onClick={() => void handleSetDefaultAddress(addr)}
                              className="text-xs text-amber-500 hover:underline cursor-pointer"
                            >
                              Tornar padrão
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditAddressForm(addr)}
                            className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white cursor-pointer"
                          >
                            <Edit2 size={12} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteAddress(addr.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 size={12} /> Remover
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
                <h2 className="text-lg font-bold uppercase tracking-wider text-amber-500 mb-4 border-b border-zinc-800 pb-2">
                  Histórico de Pedidos
                </h2>

                {loading ? (
                  <p className="text-zinc-400 text-xs">Carregando...</p>
                ) : orders.length === 0 ? (
                  <p className="text-zinc-400 text-xs">Nenhum pedido encontrado.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-wrap justify-between items-center gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-amber-500">
                              Pedido #{order.id}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-white font-bold uppercase">
                              {order.status}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                              {order.payment_method}: {order.payment_status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500">
                            {new Date(order.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>

                        <span className="font-black text-lg text-white">
                          R$ {parseFloat(order.total).toFixed(2).replace('.', ',')}
                        </span>
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
        <div className="min-h-screen bg-zinc-950 text-amber-500 flex items-center justify-center font-bold uppercase tracking-widest text-xs">
          Carregando...
        </div>
      }
    >
      <PerfilContent />
    </Suspense>
  );
}
