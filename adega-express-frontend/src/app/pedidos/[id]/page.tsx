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
      <div className="bg-[#0e0c0a] min-h-screen text-[#f4efe6]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 space-y-6">
          <div className="h-10 w-64 bg-[#14110e] rounded-xl animate-pulse" />
          <div className="h-80 w-full bg-[#14110e] rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const stepIdx = ORDER_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="bg-[#0e0c0a] min-h-screen text-[#f4efe6] font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#c9a256]/15 pb-6">
          <div>
            <Link
              href="/pedidos"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#c9a256] hover:underline mb-2"
            >
              <ArrowLeft size={14} />
              <span>Voltar para Meus Pedidos</span>
            </Link>
            <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#f4efe6]">
              Detalhes do Pedido #{order.id}
            </h1>
            <p className="text-xs text-[#9e9589] mt-1">
              Registrado em {new Date(order.created_at).toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 bg-[#14110e] px-4 py-2 rounded-full border border-[#c9a256]/30 text-xs font-semibold uppercase tracking-wider text-[#f4efe6]">
              {order.status === 'PENDENTE' && <Clock size={15} className="text-[#c9a256]" />}
              {order.status === 'CONFIRMADO' && <CheckCircle size={15} className="text-sky-400" />}
              {order.status === 'SEPARADO' && <Package size={15} className="text-violet-400" />}
              {order.status === 'EM_ROTA' && <Truck size={15} className="text-amber-400" />}
              {order.status === 'ENTREGUE' && (
                <CheckCircle size={15} className="text-emerald-400" />
              )}
              {order.status === 'CANCELADO' && <XCircle size={15} className="text-red-400" />}
              Status: {order.status}
            </span>

            <span
              className={`px-4 py-2 rounded-full border text-xs font-mono font-semibold ${
                order.payment_status === 'PAGO'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/50 border-[#c9a256]/35 text-[#c9a256]'
              }`}
            >
              Pagamento ({order.payment_method}): {order.payment_status}
            </span>
          </div>
        </div>

        {/* 5-Stage Progress Bar */}
        {order.status !== 'CANCELADO' ? (
          <div className="mb-8 p-6 rounded-3xl bg-[#14110e] border border-[#c9a256]/20">
            <div className="grid grid-cols-5 gap-3">
              {ORDER_STEPS.map((st, idx) => {
                const done = stepIdx >= idx;
                return (
                  <div key={st.key} className="flex flex-col gap-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        done ? 'bg-[#c9a256]' : 'bg-[#26201b]'
                      }`}
                    />
                    <span
                      className={`text-xs font-mono uppercase tracking-wider ${
                        done ? 'text-[#c9a256] font-semibold' : 'text-[#9e9589]/50'
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
            <div className="mb-8 p-5 rounded-2xl bg-red-950/30 border border-red-500/30 text-xs text-red-200">
              <strong>Motivo do cancelamento:</strong> {order.cancellation_reason}
            </div>
          )
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Items & Values (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <section className="rounded-3xl border border-[#c9a256]/20 bg-[#14110e] p-6 sm:p-8 space-y-5">
              <h2 className="font-serif text-2xl font-semibold text-[#f4efe6] border-b border-[#c9a256]/15 pb-3">
                Itens e Valores do Pedido
              </h2>

              <div className="divide-y divide-[#c9a256]/10">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex justify-between items-center gap-4"
                  >
                    <div>
                      <span className="font-mono text-xs font-semibold text-[#c9a256] bg-[#0e0c0a] border border-[#c9a256]/20 px-2.5 py-1 rounded-lg mr-2.5">
                        {item.quantity}x
                      </span>
                      <span className="font-serif text-lg text-[#f4efe6]">
                        {item.product_name || item.product?.name || `Produto #${item.product_id}`}
                      </span>
                      <p className="text-xs font-mono text-[#9e9589] mt-1">
                        Valor unitário: R${' '}
                        {parseFloat(item.unit_price).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-[#f4efe6]">
                      R$ {(parseFloat(item.unit_price) * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#c9a256]/15 pt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#9e9589]">
                  <span>Subtotal dos Itens</span>
                  <span>R$ {parseFloat(order.subtotal || order.total).toFixed(2).replace('.', ',')}</span>
                </div>
                {order.discount && parseFloat(order.discount) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto Promocional</span>
                    <span>- R$ {parseFloat(order.discount).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#9e9589]">
                  <span>Taxa de Entrega</span>
                  <span>
                    R$ {parseFloat(order.shipping_fee || '0').toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-[#c9a256]/15 text-base font-bold text-[#c9a256]">
                  <span>Total Demonstrativo</span>
                  <span className="text-2xl">
                    R$ {parseFloat(order.total).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </section>

            {/* Address & Payment Record */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {order.address_snapshot && (
                <section className="rounded-3xl border border-[#c9a256]/20 bg-[#14110e] p-6 space-y-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9a256]">
                    <MapPin size={14} /> Endereço de Entrega
                  </span>
                  <p className="text-sm font-semibold text-[#f4efe6]">
                    {order.address_snapshot.street}, {order.address_snapshot.number}
                    {order.address_snapshot.complement
                      ? ` (${order.address_snapshot.complement})`
                      : ''}
                  </p>
                  <p className="text-xs text-[#9e9589]">
                    {order.address_snapshot.neighborhood} — {order.address_snapshot.city}/
                    {order.address_snapshot.state}
                  </p>
                  <p className="text-xs font-mono text-[#9e9589]/80">
                    CEP: {order.address_snapshot.zip}
                  </p>
                </section>
              )}

              <section className="rounded-3xl border border-[#c9a256]/20 bg-[#14110e] p-6 space-y-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9a256]">
                  <CreditCard size={14} /> Pagamento Demonstrativo
                </span>
                <p className="text-sm font-semibold text-[#f4efe6]">
                  Modalidade: {order.payment_method} ({order.payment_status})
                </p>
                {order.paid_at && (
                  <p className="text-xs text-emerald-400">
                    Confirmado em {new Date(order.paid_at).toLocaleString('pt-BR')}
                  </p>
                )}
                {order.payments && order.payments.length > 0 && (
                  <p className="text-xs text-[#9e9589]">
                    Ref.: {order.payments[order.payments.length - 1].reference}
                  </p>
                )}
              </section>
            </div>
          </div>

          {/* Right Column: Order History Timeline (5 cols) */}
          <div className="lg:col-span-5">
            <section className="rounded-3xl border border-[#c9a256]/20 bg-[#14110e] p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 border-b border-[#c9a256]/15 pb-3">
                <History size={18} className="text-[#c9a256]" />
                <h2 className="font-serif text-2xl font-semibold text-[#f4efe6]">
                  Histórico do Pedido
                </h2>
              </div>

              {order.history && order.history.length > 0 ? (
                <ol className="space-y-4 border-l-2 border-[#c9a256]/35 ml-2 pl-5">
                  {order.history.map((h) => (
                    <li key={h.id} className="relative space-y-1">
                      <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-[#c9a256] ring-4 ring-[#14110e]" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold uppercase text-[#c9a256]">
                          {h.status}
                        </span>
                        <span className="font-mono text-[11px] text-[#9e9589]">
                          {new Date(h.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {h.reason && (
                        <p className="text-xs text-[#f4efe6]/90 leading-relaxed">{h.reason}</p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-[#9e9589]">
                  Pedido registrado em {new Date(order.created_at).toLocaleString('pt-BR')}.
                </p>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
