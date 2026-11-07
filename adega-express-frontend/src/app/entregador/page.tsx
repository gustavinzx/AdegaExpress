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
    <div className="bg-[#0e0c0a] min-h-screen font-sans text-[#f4efe6]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10 pb-24">
        <div className="mb-8 flex items-center justify-between border-b border-[#c9a256]/15 pb-5">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#c9a256]">
              Console Logístico • UC03
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#f4efe6] mt-1">
              Minhas Entregas Atribuídas
            </h1>
            <p className="text-xs text-[#9e9589] mt-1">
              Sincronização automática com o status do pedido (RN06 e RN09).
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchDeliveries()}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-[#14110e] hover:border-[#c9a256] border border-[#c9a256]/20 text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            <RefreshCw size={14} className="text-[#c9a256]" /> Atualizar
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-3xl border border-[#c9a256]/15 bg-[#14110e] animate-pulse"
              />
            ))}
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-[#14110e] border border-[#c9a256]/15 rounded-3xl p-12 text-center">
            <Package className="mx-auto text-[#c9a256]/50 mb-4" size={44} />
            <h2 className="font-serif text-2xl font-semibold text-[#f4efe6]">
              Nenhuma entrega atribuída no momento
            </h2>
            <p className="text-xs text-[#9e9589] mt-2">
              Assim que um Atendente ou Administrador atribuir um pedido separado a você, ele
              aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {deliveries.map((del) => {
              const addr = del.order?.address_snapshot;
              const paymentOk = del.order?.payment_status === 'PAGO';

              return (
                <div
                  key={del.id}
                  className={`p-6 rounded-3xl border transition-all ${
                    del.status === 'ENTREGUE'
                      ? 'bg-[#12100e]/60 border-[#c9a256]/10 opacity-65'
                      : 'bg-[#14110e] border-[#c9a256]/30 shadow-2xl'
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-4 border-b border-[#c9a256]/12 pb-4">
                    <div>
                      <span className="text-[10px] font-mono bg-[#c9a256]/15 text-[#c9a256] border border-[#c9a256]/30 px-2.5 py-0.5 rounded-full uppercase">
                        Pedido #{del.order_id} (Status: {del.order?.status})
                      </span>
                      <h3 className="font-serif text-2xl font-semibold mt-2 text-[#f4efe6]">
                        {del.order?.user?.name || 'Cliente'}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider block ${
                          del.status === 'ENTREGUE'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                            : del.status === 'SAIU_PARA_ENTREGA'
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-500/30'
                              : 'bg-[#0e0c0a] text-[#c9a256] border border-[#c9a256]/25'
                        }`}
                      >
                        {del.status.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-mono mt-1.5 inline-block px-2.5 py-0.5 rounded-full ${
                          paymentOk
                            ? 'bg-emerald-950/40 text-emerald-300'
                            : 'bg-red-950/50 text-red-300'
                        }`}
                      >
                        Pagamento ({del.order?.payment_method}): {del.order?.payment_status}
                      </span>
                    </div>
                  </div>

                  {addr && (
                    <div className="bg-[#0e0c0a] p-4 rounded-2xl mb-5 flex items-start gap-3 border border-[#c9a256]/12">
                      <MapPin className="text-[#c9a256] shrink-0 mt-0.5" size={18} />
                      <div className="text-sm text-[#f4efe6]">
                        <p className="font-semibold">
                          {addr.street}, {addr.number}
                          {addr.complement ? ` (${addr.complement})` : ''}
                        </p>
                        <p className="text-[#9e9589] text-xs mt-0.5">
                          {addr.neighborhood} — {addr.city}/{addr.state}
                        </p>
                        <p className="text-[#9e9589]/70 text-xs font-mono mt-1">CEP: {addr.zip}</p>
                      </div>
                    </div>
                  )}

                  {!paymentOk && del.status !== 'ENTREGUE' && (
                    <div className="mb-4 rounded-xl bg-amber-950/40 border border-amber-500/40 p-3 flex items-center gap-2 text-xs text-amber-200">
                      <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                      <span>
                        <strong>RN09:</strong> A entrega só poderá ser marcada como{' '}
                        <strong>ENTREGUE</strong> quando o pagamento demonstrativo estiver
                        confirmado como <strong>PAGO</strong>.
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    {del.status === 'AGUARDANDO' && (
                      <button
                        disabled={updating === del.id}
                        onClick={() => void updateStatus(del.id, 'SAIU_PARA_ENTREGA')}
                        className="w-full h-12 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold uppercase tracking-[0.16em] text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                      >
                        <Truck size={18} />
                        {updating === del.id
                          ? 'Registrando...'
                          : 'Registrar Saída para Entrega (EM ROTA)'}
                      </button>
                    )}

                    {del.status === 'SAIU_PARA_ENTREGA' && (
                      <button
                        disabled={updating === del.id || !paymentOk}
                        onClick={() => void updateStatus(del.id, 'ENTREGUE')}
                        className={`w-full h-12 rounded-full font-semibold uppercase tracking-[0.16em] text-xs flex items-center justify-center gap-2 transition-all ${
                          paymentOk
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg'
                            : 'bg-[#1f1b18] text-[#9e9589]/50 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle size={18} />
                        {updating === del.id
                          ? 'Concluindo...'
                          : paymentOk
                            ? 'Confirmar Entrega Concluída (ENTREGUE)'
                            : 'Aguardando Pagamento PAGO (RN09)'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
