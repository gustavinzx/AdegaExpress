'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { CheckCircle, Truck, MapPin, Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Delivery {
  id: number;
  order_id: number;
  status: 'AGUARDANDO' | 'SAIU_PARA_ENTREGA' | 'ENTREGUE';
  order: {
    id: number;
    status: string;
    total: string;
    payment_method: string;
    payment_status: string;
    address_snapshot: any;
    user: { name: string };
  };
}

export default function Entregador() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'ENTREGADOR') {
      router.push('/');
      return;
    }
    fetchDeliveries();
  }, [isAuthenticated, user]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.getPaginated<Delivery[]>('/deliveries/me');
      setDeliveries(res.data);
    } catch (e) {
      toast.error('Erro ao buscar entregas.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      setUpdating(id);
      await api.patch(`/deliveries/${id}/status`, { status: newStatus });
      toast.success('Status da entrega atualizado!');
      fetchDeliveries();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao atualizar.');
    } finally {
      setUpdating(null);
    }
  };

  if (!user || user.role !== 'ENTREGADOR') return null;

  return (
    <div className="bg-zinc-950 min-h-screen font-sans text-white">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-amber-500">Minhas Entregas</h1>
            <p className="text-sm text-zinc-400">Gerencie os pedidos atribuídos a você</p>
          </div>
          <button onClick={fetchDeliveries} className="text-xs bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-sm hover:bg-zinc-800 transition-colors uppercase font-bold text-zinc-300">
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 font-bold uppercase animate-pulse">Carregando rotas...</div>
        ) : deliveries.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-sm text-center">
            <Package size={48} className="mx-auto text-zinc-700 mb-4" />
            <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-widest">Nenhuma entrega no momento</h2>
            <p className="text-sm text-zinc-500 mt-2">Aguarde o administrador atribuir pedidos a você.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map(d => {
              const addr = d.order.address_snapshot;
              return (
                <div key={d.id} className={`border-2 rounded-sm overflow-hidden bg-zinc-900 transition-colors ${d.status === 'SAIU_PARA_ENTREGA' ? 'border-amber-500' : 'border-zinc-800'}`}>
                  {/* HEADER */}
                  <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pedido #{d.order.id}</span>
                      <h3 className="font-bold text-white text-sm">{d.order.user.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${d.status === 'AGUARDANDO' ? 'bg-zinc-800 text-zinc-300' : d.status === 'SAIU_PARA_ENTREGA' ? 'bg-amber-600 text-black' : 'bg-green-600 text-white'}`}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  
                  {/* BODY */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <MapPin size={18} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-zinc-300">
                        <p className="font-bold text-white">{addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`}</p>
                        <p className="text-zinc-400">{addr.neighborhood}, {addr.city} - {addr.state}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm border-t border-zinc-800 pt-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cobrança</p>
                        <p className="font-bold text-amber-500">R$ {Number(d.order.total).toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pagamento</p>
                        <p className={`font-bold ${d.order.payment_status === 'PAGO' ? 'text-green-500' : 'text-red-500'}`}>
                          {d.order.payment_method} - {d.order.payment_status}
                        </p>
                      </div>
                    </div>
                    
                    {d.status !== 'ENTREGUE' && d.order.payment_status !== 'PAGO' && (
                      <div className="mt-4 bg-red-950/50 border border-red-900/50 p-3 rounded-sm flex items-center gap-2 text-xs text-red-400">
                        <AlertTriangle size={14} />
                        Atenção: O pedido ainda não foi confirmado como PAGO pelo caixa.
                      </div>
                    )}
                  </div>
                  
                  {/* ACTIONS */}
                  {d.status !== 'ENTREGUE' && (
                    <div className="p-3 bg-black flex gap-2">
                      {d.status === 'AGUARDANDO' && (
                        <button 
                          onClick={() => updateStatus(d.id, 'SAIU_PARA_ENTREGA')}
                          disabled={updating === d.id}
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest text-[11px] py-3 rounded-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                          <Truck size={16} /> Iniciar Rota
                        </button>
                      )}
                      {d.status === 'SAIU_PARA_ENTREGA' && (
                        <button 
                          onClick={() => updateStatus(d.id, 'ENTREGUE')}
                          disabled={updating === d.id}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-[11px] py-3 rounded-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(22,163,74,0.3)]"
                        >
                          <CheckCircle size={16} /> Confirmar Entrega
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
