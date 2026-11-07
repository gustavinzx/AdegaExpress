'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  MapPin,
  CreditCard,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ORDER_STEPS = [
  { key: 'PENDENTE', label: '1. Pendente' },
  { key: 'CONFIRMADO', label: '2. Confirmado' },
  { key: 'SEPARADO', label: '3. Separado' },
  { key: 'EM_ROTA', label: '4. Em Rota' },
  { key: 'ENTREGUE', label: '5. Entregue' },
] as const;

export default function DetalhePedidoPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/pedidos');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!isAuthenticated || !params?.id) return;
      try {
        setLoading(true);
        const res = await api.get<Order>(`/orders/${params.id}`);
        setOrder(res);
      } catch {
        toast.error('Não foi possível carregar os detalhes do pedido.');
        router.push('/pedidos');
      } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [isAuthenticated, params?.id, router]);

  if (isLoading || loading) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen text-slate-900">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-64 w-full bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const stepIdx = ORDER_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-900 font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <div>
            <Link
              href="/pedidos"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline mb-1.5"
            >
              <ArrowLeft size={13} />
              <span>Voltar para Meus Pedidos</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Detalhes do Pedido #{order.id}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Registrado em {new Date(order.created_at).toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-xs">
              {order.status === 'PENDENTE' && <Clock size={14} className="text-amber-600" />}
              {order.status === 'CONFIRMADO' && <CheckCircle size={14} className="text-teal-600" />}
              {order.status === 'SEPARADO' && <Package size={14} className="text-indigo-600" />}
              {order.status === 'EM_ROTA' && <Truck size={14} className="text-blue-600" />}
              {order.status === 'ENTREGUE' && <CheckCircle size={14} className="text-emerald-600" />}
              {order.status === 'CANCELADO' && <XCircle size={14} className="text-rose-600" />}
              <span>Status: {order.status}</span>
            </span>

            <span
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                order.payment_status === 'PAGO'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              Pagamento ({order.payment_method}): {order.payment_status}
            </span>
          </div>
        </div>

        {/* 5-Stage Stepper */}
        {order.status !== 'CANCELADO' ? (
          <div className="mb-6 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="grid grid-cols-5 gap-2">
              {ORDER_STEPS.map((st, idx) => {
                const done = stepIdx >= idx;
                return (
                  <div key={st.key} className="flex flex-col gap-1.5">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        done ? 'bg-teal-600' : 'bg-slate-200'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        done ? 'text-teal-800' : 'text-slate-400'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          order.cancellation_reason && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              <strong>Motivo do cancelamento:</strong> {order.cancellation_reason}
            </div>
          )
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Items & Values */}
          <div className="lg:col-span-7 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Itens do Pedido
              </h2>

              <div className="divide-y divide-slate-100">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 first:pt-0 last:pb-0 flex justify-between items-center gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                          {item.quantity}x
                        </span>
                        <span className="font-semibold text-slate-900 text-sm">
                          {item.product_name || item.product?.name || `Produto #${item.product_id}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Valor unitário: R$ {parseFloat(item.unit_price).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      R$ {(parseFloat(item.unit_price) * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    R$ {parseFloat(order.subtotal || order.total).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {order.discount && parseFloat(order.discount) > 0 && (
                  <div className="flex justify-between text-teal-700 font-semibold">
                    <span>Desconto</span>
                    <span>- R$ {parseFloat(order.discount).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Taxa de Entrega</span>
                  <span className="font-semibold text-slate-900">
                    R$ {parseFloat(order.shipping_fee || '0').toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-xl text-teal-800">
                    R$ {parseFloat(order.total).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </section>

            {/* Address & Payment Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {order.address_snapshot && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-xs">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                    <MapPin size={12} /> Endereço de Entrega
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {order.address_snapshot.street}, {order.address_snapshot.number}
                    {order.address_snapshot.complement ? ` (${order.address_snapshot.complement})` : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {order.address_snapshot.neighborhood} — {order.address_snapshot.city}/{order.address_snapshot.state}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    CEP: {order.address_snapshot.zip}
                  </p>
                </section>
              )}

              <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-xs">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  <CreditCard size={12} /> Pagamento
                </span>
                <p className="text-xs font-bold text-slate-900">
                  Forma: {order.payment_method} ({order.payment_status})
                </p>
                {order.paid_at && (
                  <p className="text-xs text-emerald-700 font-semibold">
                    Confirmado em {new Date(order.paid_at).toLocaleString('pt-BR')}
                  </p>
                )}
                {order.payments && order.payments.length > 0 && (
                  <p className="text-[11px] text-slate-400">
                    Ref.: {order.payments[order.payments.length - 1].reference}
                  </p>
                )}
              </section>
            </div>
          </div>

          {/* Right Column: History Timeline */}
          <div className="lg:col-span-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <History size={16} className="text-teal-700" />
                <h2 className="text-base font-bold text-slate-900">
                  Histórico do Pedido
                </h2>
              </div>

              {order.history && order.history.length > 0 ? (
                <ol className="space-y-3.5 border-l-2 border-slate-200 ml-1.5 pl-4">
                  {order.history.map((h) => (
                    <li key={h.id} className="relative space-y-0.5">
                      <span className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full bg-teal-600 ring-2 ring-white" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase text-slate-800">
                          {h.status}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {h.reason && (
                        <p className="text-xs text-slate-500 leading-relaxed">{h.reason}</p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-500">
                  Registrado em {new Date(order.created_at).toLocaleString('pt-BR')}.
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
