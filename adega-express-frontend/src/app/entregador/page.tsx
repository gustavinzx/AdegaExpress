'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { CheckCircle, Truck, MapPin, Package, AlertTriangle, RefreshCw } from 'lucide-react';
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
    address_snapshot: {
      street: string;
      number: string;
      complement?: string | null;
      neighborhood: string;
      city: string;
      state: string;
      zip: string;
    };
    user: { name: string };
  };
}

export default function Entregador() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.getPaginated<Delivery[]>('/deliveries/me');
      setDeliveries(res.data || []);
    } catch {
      toast.error('Erro ao buscar entregas atribuídas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/entregador');
      return;
    }
    if (!isLoading && user && user.role !== 'ENTREGADOR') {
      router.push('/');
      return;
    }
    if (isAuthenticated && user?.role === 'ENTREGADOR') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchDeliveries();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const updateStatus = async (id: number, newStatus: 'SAIU_PARA_ENTREGA' | 'ENTREGUE') => {
    try {
      setUpdating(id);
      await api.patch(`/deliveries/${id}/status`, { status: newStatus });
      toast.success(
        newStatus === 'SAIU_PARA_ENTREGA'
          ? 'Saída registrada! Pedido sincronizado para EM_ROTA.'
          : 'Entrega concluída! Pedido sincronizado para ENTREGUE.',
      );
      await fetchDeliveries();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar entrega.';
      toast.error(msg);
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading || !user || user.role !== 'ENTREGADOR') return null;

  return (
    <div className="bg-zinc-950 min-h-screen font-sans text-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-black uppercase tracking-wider text-amber-500">
              Minhas Entregas Atribuídas (UC03)
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Atualize o andamento das suas entregas (sincroniza o pedido automaticamente — RN06).
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchDeliveries()}
            className="inline-flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-700 px-3.5 py-2 rounded hover:bg-zinc-800 transition-colors uppercase font-bold text-zinc-200"
          >
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-amber-500 font-black uppercase tracking-widest animate-pulse text-xs">
            Carregando entregas...
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-xl text-center">
            <Package size={44} className="mx-auto text-zinc-600 mb-3" />
            <h2 className="text-base font-bold text-zinc-300 uppercase tracking-wider">
              Nenhuma entrega atribuída no momento
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Aguarde o Atendente ou Administrador atribuir pedidos separados a você.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((d) => {
              const addr = d.order.address_snapshot;
              const isPaid = d.order.payment_status === 'PAGO';
              return (
                <div
                  key={d.id}
                  className={`border rounded-xl overflow-hidden bg-zinc-900 transition-colors shadow-lg ${
                    d.status === 'SAIU_PARA_ENTREGA' ? 'border-amber-500' : 'border-zinc-800'
                  }`}
                >
                  {/* HEADER */}
                  <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Entrega #{d.id} • Pedido #{d.order.id}
                      </span>
                      <h3 className="font-bold text-white text-sm mt-0.5">
                        Cliente: {d.order.user?.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded ${
                          d.status === 'AGUARDANDO'
                            ? 'bg-zinc-800 text-zinc-200'
                            : d.status === 'SAIU_PARA_ENTREGA'
                              ? 'bg-amber-600 text-black'
                              : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="p-4">
                    {addr && (
                      <div className="flex items-start gap-3 mb-4">
                        <MapPin size={18} className="text-amber-500 mt-0.5 shrink-0" />
                        <div className="text-xs text-zinc-300">
                          <p className="font-bold text-white text-sm">
                            {addr.street}, {addr.number}{' '}
                            {addr.complement ? `— ${addr.complement}` : ''}
                          </p>
                          <p className="text-zinc-400 mt-0.5">
                            {addr.neighborhood}, {addr.city} - {addr.state} • CEP: {addr.zip}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs border-t border-zinc-800 pt-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Valor do Pedido
                        </p>
                        <p className="font-black text-sm text-amber-500">
                          R$ {Number(d.order.total).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Pagamento Demonstrativo
                        </p>
                        <p className={`font-bold ${isPaid ? 'text-emerald-400' : 'text-red-400'}`}>
                          {d.order.payment_method} — {d.order.payment_status}
                        </p>
                      </div>
                    </div>

                    {d.status !== 'ENTREGUE' && !isPaid && (
                      <div className="mt-4 bg-red-950/50 border border-red-900/50 p-3 rounded flex items-center gap-2 text-xs text-red-300">
                        <AlertTriangle size={15} className="shrink-0" />
                        <span>
                          <strong>RN09:</strong> A entrega só pode ser concluída como ENTREGUE
                          quando o pagamento estiver confirmado como PAGO pela equipe.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ACTIONS (UC03) */}
                  {d.status !== 'ENTREGUE' && (
                    <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2">
                      {d.status === 'AGUARDANDO' && (
                        <button
                          type="button"
                          onClick={() => void updateStatus(d.id, 'SAIU_PARA_ENTREGA')}
                          disabled={updating === d.id}
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest text-xs py-3 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                          <Truck size={16} /> Registrar Saída para Entrega (EM_ROTA)
                        </button>
                      )}
                      {d.status === 'SAIU_PARA_ENTREGA' && (
                        <button
                          type="button"
                          onClick={() => void updateStatus(d.id, 'ENTREGUE')}
                          disabled={updating === d.id || !isPaid}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs py-3 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle size={16} /> Confirmar Entrega Concluída (ENTREGUE)
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
