'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { User as UserIcon, MapPin, ShoppingBag, Plus, Trash2, CheckCircle, Package, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Address {
  id: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
}

export default function Perfil() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'DADOS' | 'ENDERECOS' | 'PEDIDOS'>('DADOS');
  
  // Data States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Address Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPixModal, setShowPixModal] = useState<number | null>(null);
  const [newAddr, setNewAddr] = useState({
    zip: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: 'SP', is_default: false
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/perfil');
      return;
    }
    fetchData();
  }, [isAuthenticated, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ENDERECOS') {
        const res = await api.get<Address[]>('/addresses');
        setAddresses(res);
      } else if (activeTab === 'PEDIDOS') {
        const res = await api.getPaginated<any[]>('/orders/me');
        setOrders(res.data);
      }
    } catch (e: any) {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload: any = { ...newAddr };
      if (!payload.complement?.trim()) {
        delete payload.complement;
      }
      await api.post('/addresses', payload);
      toast.success('Endereço adicionado com sucesso!');
      setShowAddForm(false);
      setNewAddr({ zip: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: 'SP', is_default: false });
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar endereço');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: number) => {
    if (!confirm('Deseja realmente excluir este endereço?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Endereço removido.');
      fetchData();
    } catch (e: any) {
      toast.error('Erro ao remover endereço.');
    }
  };

  if (!user) return null;

  return (
    <div className="bg-zinc-950 min-h-screen font-sans text-white pb-20">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-0.5 w-12 bg-amber-600"></div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest drop-shadow-xl">Meu Perfil</h1>
          <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-amber-600/50"></div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* SIDEBAR TABS */}
          <aside className="w-full md:w-64 space-y-2">
            <button 
              onClick={() => setActiveTab('DADOS')}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg font-bold transition-all uppercase tracking-widest text-xs border ${activeTab === 'DADOS' ? 'bg-amber-600 text-black border-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
              <UserIcon size={18} /> Meus Dados
            </button>
            <button 
              onClick={() => setActiveTab('ENDERECOS')}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg font-bold transition-all uppercase tracking-widest text-xs border ${activeTab === 'ENDERECOS' ? 'bg-amber-600 text-black border-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
              <MapPin size={18} /> Meus Endereços
            </button>
            <button 
              onClick={() => setActiveTab('PEDIDOS')}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg font-bold transition-all uppercase tracking-widest text-xs border ${activeTab === 'PEDIDOS' ? 'bg-amber-600 text-black border-amber-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
              <ShoppingBag size={18} /> Meus Pedidos
            </button>
          </aside>

          {/* CONTENT AREA */}
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-10 shadow-2xl">
            
            {loading && activeTab !== 'DADOS' && (
              <div className="text-center py-10 text-amber-500 font-black tracking-widest uppercase animate-pulse">
                Carregando...
              </div>
            )}

            {!loading && activeTab === 'DADOS' && (
              <div>
                <h2 className="text-xl font-black uppercase text-white mb-6">Informações Pessoais</h2>
                <div className="grid gap-6">
                  <div className="bg-zinc-950 p-4 rounded border border-zinc-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Nome Completo</p>
                    <p className="font-bold text-lg text-white">{user.name}</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded border border-zinc-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Email</p>
                    <p className="font-bold text-lg text-white">{user.email}</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded border border-zinc-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Nível de Acesso</p>
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded text-xs font-black uppercase">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!loading && activeTab === 'ENDERECOS' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-black uppercase text-white">Meus Endereços</h2>
                  {!showAddForm && (
                    <button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded flex items-center gap-2 border border-zinc-700 transition-colors"
                    >
                      <Plus size={14} /> Adicionar
                    </button>
                  )}
                </div>

                {showAddForm ? (
                  <form onSubmit={handleAddAddress} className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 space-y-4 mb-6">
                    <h3 className="text-sm font-black uppercase text-amber-500 mb-4">Novo Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">CEP</label>
                        <input required value={newAddr.zip} onChange={e => setNewAddr({...newAddr, zip: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-amber-500 outline-none" placeholder="00000-000" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Estado (UF)</label>
                        <input required value={newAddr.state} onChange={e => setNewAddr({...newAddr, state: e.target.value.toUpperCase()})} maxLength={2} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-amber-500 outline-none" placeholder="SP" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Rua</label>
                        <input required value={newAddr.street} onChange={e => setNewAddr({...newAddr, street: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-amber-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Número</label>
                        <input required value={newAddr.number} onChange={e => setNewAddr({...newAddr, number: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-amber-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Complemento (Opcional)</label>
                        <input value={newAddr.complement} onChange={e => setNewAddr({...newAddr, complement: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-amber-500 outline-none" placeholder="Apto 101, Bloco B..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Bairro</label>
                        <input required value={newAddr.neighborhood} onChange={e => setNewAddr({...newAddr, neighborhood: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-amber-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Cidade</label>
                        <input required value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-amber-500 outline-none" />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-transparent border border-zinc-700 text-white font-bold py-2 rounded text-xs uppercase hover:bg-zinc-800">Cancelar</button>
                      <button type="submit" disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest py-2 rounded text-xs disabled:opacity-50">Salvar Endereço</button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {addresses.length === 0 ? (
                      <div className="text-center py-10 bg-zinc-950 border border-zinc-800 rounded">
                        <p className="text-zinc-500 text-sm">Você ainda não tem endereços cadastrados.</p>
                      </div>
                    ) : (
                      addresses.map(addr => (
                        <div key={addr.id} className="bg-zinc-950 p-4 rounded border border-zinc-800 flex justify-between items-center group">
                          <div>
                            {addr.is_default && <span className="inline-block bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-1 rounded mb-2 uppercase">Principal</span>}
                            <p className="font-bold text-white text-sm">{addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`}</p>
                            <p className="text-xs text-zinc-400 mt-1">{addr.neighborhood}, {addr.city} - {addr.state} | CEP: {addr.zip}</p>
                          </div>
                          <button onClick={() => deleteAddress(addr.id)} className="text-zinc-600 hover:text-red-500 transition-colors p-2" title="Excluir Endereço">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {!loading && activeTab === 'PEDIDOS' && (
              <div>
                <h2 className="text-xl font-black uppercase text-white mb-6">Histórico de Pedidos</h2>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-10 bg-zinc-950 border border-zinc-800 rounded">
                      <p className="text-zinc-500 text-sm">Você ainda não fez nenhum pedido.</p>
                      <button onClick={() => router.push('/')} className="mt-4 bg-amber-600 text-black font-black text-xs uppercase px-6 py-2 rounded hover:bg-amber-500">Ir para a Loja</button>
                    </div>
                  ) : (
                    orders.map(order => (
                      <div key={order.id} className="bg-zinc-950 p-5 rounded border border-zinc-800 shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase">Pedido #{order.id}</span>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="bg-zinc-800 text-amber-500 text-[10px] font-black uppercase px-2 py-1 rounded">
                                {order.status}
                              </span>
                              {order.payment_status === 'PAGO' ? (
                                <span className="bg-green-500/10 text-green-500 text-[10px] font-black uppercase px-2 py-1 rounded flex items-center gap-1">
                                  <CheckCircle size={10} /> PAGO
                                </span>
                              ) : (
                                <span className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase px-2 py-1 rounded">
                                  AGUARDANDO PAGAMENTO
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">

                            <span className="text-lg font-black text-amber-500">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
                            <p className="text-[10px] text-zinc-500 uppercase mt-1">{order.payment_method}</p>
                            
                            {order.payment_method === 'PIX' && order.payment_status !== 'PAGO' && order.status !== 'CANCELADO' && (
                               <button onClick={() => setShowPixModal(order.id)} className="mt-2 bg-amber-600 hover:bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded transition-colors inline-block text-center w-full">
                                  Ver PIX
                               </button>
                            )}

                          </div>
                        </div>
                        <div className="border-t border-zinc-800 pt-3">
                          <p className="text-xs text-zinc-400 mb-2 font-bold uppercase tracking-widest">Itens:</p>
                          {order.items?.map((item: any) => (
                            <p key={item.id} className="text-sm text-zinc-300">
                              <span className="font-bold text-white">{item.quantity}x</span> {item.product_name}
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
      
        {showPixModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full p-6 text-center shadow-2xl relative">
                <button onClick={() => setShowPixModal(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                  <XCircle size={24} />
                </button>
                <h2 className="text-xl font-black uppercase text-white tracking-widest mb-2">Pague com PIX</h2>
                <p className="text-xs text-zinc-400 mb-6">Escaneie o QR Code abaixo pelo app do seu banco para confirmar o pedido #{showPixModal}.</p>
                
                <div className="bg-white p-4 rounded-lg inline-block mb-6 shadow-inner">
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014br.gov.bcb.pix0136random-uuid-adega-express-${showPixModal}5204000053039865802BR5913Adega Express6008Brasilia62070503***6304`} alt="QR Code PIX" className="w-48 h-48" />
                </div>
                
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded text-left mb-6">
                   <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">PIX Copia e Cola (Simulação)</p>
                   <p className="text-xs text-zinc-300 font-mono break-all line-clamp-2">00020126580014br.gov.bcb.pix0136random-uuid-adega-express-5204000053039865802BR5913Adega Express...</p>
                </div>
                
                <div className="text-[10px] text-amber-500 font-bold uppercase">
                  Assim que pagar, o administrador do sistema confirmará seu pagamento no Painel de Controle.
                </div>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}
