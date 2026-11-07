'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { CheckCircle, Truck, MapPin, Package, RefreshCw } from 'lucide-react';
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
      toast.error('Erro ao buscar entregas.');
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
          ? 'Saída para entrega registrada!'
          : 'Entrega concluída!',
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

      <main className="max-w-3xl mx-auto px-4 py-10 pb-24">
        <div className="mb-8 flex items-center justify-between border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-serif font-black uppercase tracking-wider text-white">
            Minhas Entregas
          </h1>
          <button
            type="button"
            onClick={() => void fetchDeliveries()}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase cursor-pointer"
          >
            <RefreshCw size={13} className="text-amber-500" /> Atualizar
          </button>
        </div>

        {loading ? (
          <p className="text-zinc-400 text-xs">Carregando entregas...</p>
        ) : deliveries.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <Package className="mx-auto text-zinc-600 mb-3" size={40} />
            <h2 className="text-base font-bold text-white">Nenhuma entrega atribuída</h2>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((del) => {
              const addr = del.order?.address_snapshot;
              const paymentOk = del.order?.payment_status === 'PAGO';

              return (
                <div
                  key={del.id}
                  className={`p-5 rounded-xl border ${
                    del.status === 'ENTREGUE'
                      ? 'bg-zinc-900/40 border-zinc-800 opacity-60'
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4 border-b border-zinc-800 pb-3">
                    <div>
                      <span className="text-xs font-bold text-amber-500">
                        Pedido #{del.order_id}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {del.order?.user?.name || 'Cliente'}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 uppercase block">
                        {del.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-1 block">
                        Pagamento: {del.order?.payment_status}
                      </span>
                    </div>
                  </div>

                  {addr && (
                    <div className="bg-zinc-950 p-3.5 rounded-lg mb-4 flex items-start gap-2.5 border border-zinc-800 text-xs">
                      <MapPin className="text-amber-500 shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="font-bold text-white">
                          {addr.street}, {addr.number}
                          {addr.complement ? ` (${addr.complement})` : ''}
                        </p>
                        <p className="text-zinc-400">
                          {addr.neighborhood} — {addr.city}/{addr.state} • CEP {addr.zip}
                        </p>
                      </div>
                    </div>
                  )}

                  {del.status === 'AGUARDANDO' && (
                    <button
                      disabled={updating === del.id}
                      onClick={() => void updateStatus(del.id, 'SAIU_PARA_ENTREGA')}
                      className="w-full h-11 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Truck size={16} />
                      {updating === del.id ? 'Atualizando...' : 'Saiu para Entrega'}
                    </button>
                  )}

                  {del.status === 'SAIU_PARA_ENTREGA' && (
                    <button
                      disabled={updating === del.id || !paymentOk}
                      onClick={() => void updateStatus(del.id, 'ENTREGUE')}
                      className={`w-full h-11 rounded-lg font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 ${
                        paymentOk
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle size={16} />
                      {updating === del.id
                        ? 'Concluindo...'
                        : paymentOk
                          ? 'Confirmar Entrega'
                          : 'Aguardando Confirmação de Pagamento'}
                    </button>
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
