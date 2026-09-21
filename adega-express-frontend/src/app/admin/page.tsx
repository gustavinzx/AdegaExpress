'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, Users, LogOut, Search, CheckCircle, Clock, Truck, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'PEDIDOS' | 'ESTOQUE' | 'EQUIPE'>('PEDIDOS');
  const [loading, setLoading] = useState(true);

  // Dados
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [deliverers, setDeliverers] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'ADMINISTRADOR' && user?.role !== 'ATENDENTE') {
      router.push('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'PEDIDOS') {
        const oRes = await api.getPaginated<any[]>('/orders');
        setOrders(oRes.data);
        const dRes = await api.get<any[]>('/staff/deliverers');
        setDeliverers(dRes);
      } else if (activeTab === 'ESTOQUE') {
        const pRes = await api.getPaginated<any[]>('/products?limit=100');
        setProducts(pRes.data);
      }
    } catch (e: any) {
      toast.error('Erro ao buscar dados: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Funções de Pedidos
  const changeOrderStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success(`Pedido atualizado para ${status}`);
      fetchData();
    } catch(e: any) { toast.error(e.message); }
  };

  const confirmPayment = async (id: number) => {
    try {
      await api.patch(`/orders/${id}/payment`, { status: 'PAGO', reference: 'Confirmado Manualmente' });
      toast.success('Pagamento confirmado!');
      fetchData();
    } catch(e: any) { toast.error(e.message); }
  };

  const assignDeliverer = async (deliveryId: number, delivererId: number) => {
    try {
      await api.patch(`/deliveries/${deliveryId}/assign`, { deliverer_id: Number(delivererId) });
      toast.success('Entregador atribuído!');
      fetchData();
    } catch(e: any) { toast.error(e.message); }
  };

  if (!user || (user.role !== 'ADMINISTRADOR' && user.role !== 'ATENDENTE')) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex font-sans text-white">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-black border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-center">
          <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-full border-2 border-amber-500 mr-3" />
          <span className="font-black text-xl tracking-tighter">ADEGA<span className="text-amber-500">EXPRESS</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('PEDIDOS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all uppercase tracking-widest text-xs ${activeTab === 'PEDIDOS' ? 'bg-amber-600 text-black' : 'text-zinc-400 hover:bg-zinc-900 hover:text-amber-500'}`}
          >
            <ShoppingBag size={18} /> Operação de Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('ESTOQUE')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all uppercase tracking-widest text-xs ${activeTab === 'ESTOQUE' ? 'bg-amber-600 text-black' : 'text-zinc-400 hover:bg-zinc-900 hover:text-amber-500'}`}
          >
            <Package size={18} /> Gestão de Estoque
          </button>
        </nav>
        
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-black flex items-center justify-center font-black">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{user.name}</p>
              <p className="text-[10px] text-amber-500 uppercase">{user.role}</p>
            </div>
          </div>
          <Link href="/" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-md text-xs font-bold transition-colors">
            Ir para a Loja
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md">
          <h1 className="text-xl font-black uppercase tracking-widest text-white">
            {activeTab === 'PEDIDOS' && 'Mesa de Operações'}
            {activeTab === 'ESTOQUE' && 'Controle de Estoque'}
          </h1>
          <button onClick={fetchData} className="text-xs bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-sm hover:bg-zinc-800 font-bold uppercase tracking-widest">
            Recarregar Dados
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="text-amber-500 font-black tracking-widest uppercase animate-pulse">Sincronizando Sistema...</span>
            </div>
          ) : (
            <>
              {/* ABA PEDIDOS */}
              {activeTab === 'PEDIDOS' && (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500 bg-zinc-900 rounded-lg border border-zinc-800">Nenhum pedido recente.</div>
                  ) : (
                    orders.map(order => (
                      <div key={order.id} className={`bg-zinc-900 border rounded-lg p-6 flex flex-col lg:flex-row gap-6 shadow-xl ${order.status === 'PENDENTE' ? 'border-amber-500' : 'border-zinc-800'}`}>
                        
                        {/* Info Pedido */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-black text-white">Pedido #{order.id}</h3>
                            <span className="bg-zinc-800 text-amber-500 text-[10px] font-black uppercase px-2 py-1 rounded">
                              {order.status}
                            </span>
                            {order.payment_status === 'PAGO' ? (
                              <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-black uppercase px-2 py-1 rounded flex items-center gap-1">
                                <Check size={12} /> PAGO
                              </span>
                            ) : (
                              <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase px-2 py-1 rounded">
                                AGUARDANDO PAGAMENTO
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 mb-1">Cliente: <strong className="text-white">{order.user.name}</strong></p>
                          <p className="text-sm text-zinc-400 mb-4">Pagamento: {order.payment_method}</p>
                          
                          <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                            <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Itens</p>
                            {order.items?.map((item: any) => (
                              <div key={item.id} className="text-xs text-zinc-300 flex justify-between">
                                <span>{item.quantity}x {item.product_name}</span>
                                <span>R$ {Number(item.unit_price).toFixed(2).replace('.', ',')}</span>
                              </div>
                            ))}
                            <div className="mt-2 pt-2 border-t border-zinc-800 flex justify-between font-bold text-amber-500">
                              <span>TOTAL</span>
                              <span>R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Ações Operacionais */}
                        <div className="w-full lg:w-72 flex flex-col gap-3 justify-center">
                          {order.payment_status !== 'PAGO' && order.status !== 'CANCELADO' && (
                            <button onClick={() => confirmPayment(order.id)} className="w-full bg-green-600 hover:bg-green-500 text-white font-black uppercase text-xs py-3 rounded transition-colors flex items-center justify-center gap-2 shadow-lg">
                              <CheckCircle size={16} /> Confirmar Pagamento
                            </button>
                          )}
                          
                          {order.status === 'PENDENTE' && (
                            <button onClick={() => changeOrderStatus(order.id, 'CONFIRMADO')} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase text-xs py-3 rounded transition-colors">
                              Aceitar Pedido
                            </button>
                          )}

                          {order.status === 'CONFIRMADO' && (
                            <button onClick={() => changeOrderStatus(order.id, 'SEPARADO')} className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black uppercase text-xs py-3 rounded transition-colors">
                              Marcar como Separado
                            </button>
                          )}

                          {order.status === 'SEPARADO' && order.delivery && (
                            <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                              <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2">Despachar com Entregador:</label>
                              <select 
                                onChange={(e) => assignDeliverer(order.delivery.id, Number(e.target.value))}
                                value={order.delivery.deliverer_id || ''}
                                className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs p-2 rounded focus:border-amber-500"
                              >
                                <option value="">-- Selecionar Motoboy --</option>
                                {deliverers.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {order.status === 'PENDENTE' && (
                            <button onClick={() => changeOrderStatus(order.id, 'CANCELADO')} className="w-full text-red-500 hover:text-red-400 font-bold uppercase text-[10px] mt-2">
                              Cancelar Pedido
                            </button>
                          )}
                        </div>

                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ABA ESTOQUE */}
              {activeTab === 'ESTOQUE' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500">
                        <th className="p-4 font-black">Produto</th>
                        <th className="p-4 font-black">Categoria</th>
                        <th className="p-4 font-black">Preço</th>
                        <th className="p-4 font-black text-center">Qtd. Estoque</th>
                        <th className="p-4 font-black text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="p-4 font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded flex items-center justify-center p-1">
                              {p.image_url ? <img src={p.image_url} className="max-h-full" /> : <span className="text-[8px] text-black">IMG</span>}
                            </div>
                            {p.name}
                          </td>
                          <td className="p-4 text-zinc-400">{p.category?.name}</td>
                          <td className="p-4 text-amber-500 font-bold">R$ {Number(p.price).toFixed(2).replace('.', ',')}</td>
                          <td className="p-4 text-center text-white font-bold">{p.stock_quantity}</td>
                          <td className="p-4 text-center">
                            {p.active ? (
                              <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-[10px] font-black uppercase">Ativo</span>
                            ) : (
                              <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-[10px] font-black uppercase">Inativo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </>
          )}
        </div>
      </main>
    </div>
  );
}
