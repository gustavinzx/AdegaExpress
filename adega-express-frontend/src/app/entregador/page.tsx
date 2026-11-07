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
      void fetchDeliveries();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const updateStatus = async (id: number, newStatus: 'SAIU_PARA_ENTREGA' | 'ENTREGUE') => {
    try {
      setUpdating(id);
      await api.patch(`/deliveries/${id}/status`, { status: newStatus });
      toast.success(
        newStatus === 'SAIU_PARA_ENTREGA'
          ? 'Saída registrada! Pedido atualizado para EM_ROTA.'
          : 'Entrega concluída! Pedido atualizado para ENTREGUE.',
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
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-slate-900">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10 pb-20">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Console Logístico
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
              Minhas Entregas Atribuídas
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhe e registre o status das entregas sob sua responsabilidade.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchDeliveries()}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer shadow-xs"
          >
            <RefreshCw size={13} className="text-teal-700" /> Atualizar
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-2xl border border-slate-200 bg-white animate-pulse"
              />
            ))}
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-xs">
            <Package className="mx-auto text-slate-300 mb-3" size={40} />
            <h2 className="text-lg font-bold text-slate-900">
              Nenhuma entrega atribuída no momento
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Assim que um operador atribuir um pacote a você, os detalhes aparecerão nesta tela.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((del) => {
              const addr = del.order?.address_snapshot;
              const paymentOk = del.order?.payment_status === 'PAGO';

              return (
                <div
                  key={del.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    del.status === 'ENTREGUE'
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          Pedido #{del.order_id}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          Status: {del.order?.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-base mt-1 text-slate-900">
                        {del.order?.user?.name || 'Cliente'}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider block ${
                          del.status === 'ENTREGUE'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : del.status === 'SAIU_PARA_ENTREGA'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {del.status.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded-md ${
                          paymentOk
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        Pagamento ({del.order?.payment_method}): {del.order?.payment_status}
                      </span>
                    </div>
                  </div>

                  {addr && (
                    <div className="bg-slate-50 p-3.5 rounded-xl mb-4 flex items-start gap-2.5 border border-slate-200">
                      <MapPin className="text-teal-700 shrink-0 mt-0.5" size={16} />
                      <div className="text-xs text-slate-800">
                        <p className="font-bold">
                          {addr.street}, {addr.number}
                          {addr.complement ? ` (${addr.complement})` : ''}
                        </p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {addr.neighborhood} — {addr.city}/{addr.state}
                        </p>
                        <p className="text-slate-400 text-[10px] font-mono mt-0.5">CEP: {addr.zip}</p>
                      </div>
                    </div>
                  )}

                  {!paymentOk && del.status !== 'ENTREGUE' && (
                    <div className="mb-3.5 rounded-xl bg-amber-50 border border-amber-200 p-2.5 flex items-center gap-2 text-xs text-amber-800">
                      <AlertTriangle size={15} className="text-amber-700 shrink-0" />
                      <span>
                        A entrega só pode ser concluída quando o pagamento constar como <strong>PAGO</strong>.
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {del.status === 'AGUARDANDO' && (
                      <button
                        disabled={updating === del.id}
                        onClick={() => void updateStatus(del.id, 'SAIU_PARA_ENTREGA')}
                        className="w-full h-11 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Truck size={16} />
                        <span>
                          {updating === del.id
                            ? 'Registrando...'
                            : 'Registrar Saída para Entrega (EM ROTA)'}
                        </span>
                      </button>
                    )}

                    {del.status === 'SAIU_PARA_ENTREGA' && (
                      <button
                        disabled={updating === del.id || !paymentOk}
                        onClick={() => void updateStatus(del.id, 'ENTREGUE')}
                        className={`w-full h-11 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
                          paymentOk
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle size={16} />
                        <span>
                          {updating === del.id
                            ? 'Concluindo...'
                            : paymentOk
                              ? 'Confirmar Entrega Concluída'
                              : 'Aguardando Pagamento PAGO'}
                        </span>
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
