'use client';

import { useEffect, useState, ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const statusIcons: Record<string, ReactNode> = {
  PENDENTE: <Clock size={16} className="text-[#c9a256]" />,
  CONFIRMADO: <CheckCircle size={16} className="text-sky-400" />,
  SEPARADO: <Package size={16} className="text-violet-400" />,
  EM_ROTA: <Truck size={16} className="text-amber-400" />,
  ENTREGUE: <CheckCircle size={16} className="text-emerald-400" />,
  CANCELADO: <XCircle size={16} className="text-red-400" />,
};

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente (Aguardando Confirmação)',
  CONFIRMADO: 'Confirmado',
  SEPARADO: 'Separado para Entrega',
  EM_ROTA: 'Em Rota de Entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const ORDER_STEPS = [
  { key: 'PENDENTE', label: '1. Pendente' },
  { key: 'CONFIRMADO', label: '2. Confirmado' },
  { key: 'SEPARADO', label: '3. Separado' },
  { key: 'EM_ROTA', label: '4. Em Rota' },
  { key: 'ENTREGUE', label: '5. Entregue' },
] as const;

export default function Pedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const fetchOrders = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await api.getPaginated<Order[]>(`/orders/me?page=${targetPage}&limit=${limit}`);
      setOrders(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages);
      }
    } catch {
      toast.error('Erro ao consultar histórico de pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/pedidos');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchOrders(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, page]);

  const handleCancelOrder = async (orderId: number) => {
    const reason = prompt('Informe o motivo do cancelamento do pedido:', 'Desistência da compra');
    if (!reason || !reason.trim()) return;
    try {
      setCancellingId(orderId);
      await api.post(`/orders/${orderId}/cancel`, { reason: reason.trim() });
      toast.success('Pedido cancelado e estoque devolvido (RN07).');
      await fetchOrders(page);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao cancelar pedido.';
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#0e0c0a] min-h-screen text-[#f4efe6]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 space-y-6">
          <div className="h-10 w-64 bg-[#14110e] rounded-xl animate-pulse" />
          <div className="h-64 w-full bg-[#14110e] rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e0c0a] min-h-screen text-[#f4efe6] font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 border-b border-[#c9a256]/15 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#c9a256]">
              Histórico &amp; Rastreabilidade • UC05
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#f4efe6] mt-1">
              Meus Pedidos
            </h1>
          </div>
          <Link
            href="/#catalogo"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c9a256] hover:underline"
          >
            Realizar novo pedido →
          </Link>
        </div>

        <div className="mb-8 rounded-2xl border border-[#c9a256]/25 bg-[#161310] p-4 flex items-start gap-3 text-xs text-[#9e9589]">
          <Info size={16} className="text-[#c9a256] shrink-0 mt-0.5" />
          <span>
            Pedidos em status <strong className="text-[#f4efe6]">PENDENTE</strong> aguardam a
            confirmação manual do pagamento demonstrativo por um Atendente ou Administrador (RN08).
            Caso não sejam confirmados em até <strong className="text-[#f4efe6]">30 minutos</strong>
            , expiram automaticamente devolvendo os itens ao estoque (RN07).
          </span>
        </div>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-56 rounded-3xl border border-[#c9a256]/12 bg-[#14110e] animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-[#14110e] rounded-3xl border border-[#c9a256]/15 px-6">
            <div className="h-16 w-16 rounded-full bg-[#c9a256]/10 border border-[#c9a256]/25 text-[#c9a256] flex items-center justify-center mx-auto mb-5">
              <Package size={26} />
            </div>
            <h2 className="font-serif text-3xl text-[#f4efe6] mb-2">
              Você ainda não realizou pedidos
            </h2>
            <p className="text-sm text-[#9e9589] mb-8 max-w-md mx-auto">
              Explore nossa curadoria de águas, sucos integrais, refrigerantes e chás.
            </p>
            <Link
              href="/#catalogo"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.18em] transition-all"
            >
              <span>Ir às Compras</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const stepIdx = ORDER_STEPS.findIndex((s) => s.key === order.status);

              return (
                <article
                  key={order.id}
                  className="bg-[#14110e] rounded-3xl border border-[#c9a256]/20 overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.55)]"
                >
                  {/* Order Header */}
                  <div className="bg-[#191511] px-6 py-5 border-b border-[#c9a256]/15 flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c9a256]">
                        Pedido #{order.id}
                      </span>
                      <p className="text-xs text-[#9e9589] mt-0.5">
                        Registrado em {new Date(order.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="inline-flex items-center gap-2 bg-[#0e0c0a] px-3.5 py-1.5 rounded-full border border-[#c9a256]/25">
                        {statusIcons[order.status]}
                        <span className="font-semibold text-xs text-[#f4efe6]">
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>

                      <div
                        className={`px-3.5 py-1.5 rounded-full border text-xs font-mono font-semibold ${
                          order.payment_status === 'PAGO'
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-950/50 border-[#c9a256]/35 text-[#c9a256]'
                        }`}
                      >
                        Pagamento ({order.payment_method}): {order.payment_status}
                      </div>

                      {order.status === 'PENDENTE' && (
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => void handleCancelOrder(order.id)}
                          className="h-9 px-4 rounded-full bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-200 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          {cancellingId === order.id ? 'Cancelando...' : 'Cancelar Pedido'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 5-Stage Progress Bar (RN04) */}
                  {order.status !== 'CANCELADO' ? (
                    <div className="px-6 py-4 bg-[#110e0c] border-b border-[#c9a256]/10">
                      <div className="grid grid-cols-5 gap-2">
                        {ORDER_STEPS.map((st, idx) => {
                          const done = stepIdx >= idx;
                          return (
                            <div key={st.key} className="flex flex-col gap-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  done ? 'bg-[#c9a256]' : 'bg-[#26201b]'
                                }`}
                              />
                              <span
                                className={`text-[10px] font-mono uppercase tracking-wider ${
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
                      <div className="px-6 py-3 bg-red-950/30 border-b border-red-900/30 text-xs text-red-300">
                        <strong>Motivo do cancelamento:</strong> {order.cancellation_reason}
                      </div>
                    )
                  )}

                  {/* Order Items & Totals */}
                  <div className="p-6">
                    <div className="divide-y divide-[#c9a256]/10 mb-5">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="py-3 first:pt-0 last:pb-0 flex justify-between items-center text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-semibold text-[#c9a256] bg-[#0e0c0a] border border-[#c9a256]/20 px-2.5 py-1 rounded-lg">
                              {item.quantity}x
                            </span>
                            <span className="font-serif text-lg text-[#f4efe6]">
                              {item.product_name ||
                                item.product?.name ||
                                `Produto #${item.product_id}`}
                            </span>
                          </div>
                          <span className="font-mono text-sm text-[#f4efe6]">
                            R${' '}
                            {(parseFloat(item.unit_price) * item.quantity)
                              .toFixed(2)
                              .replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#c9a256]/15 pt-4 flex flex-wrap justify-between items-end gap-4">
                      <div className="text-xs text-[#9e9589] space-y-1 font-mono">
                        {order.subtotal && (
                          <p>
                            Subtotal: R$ {parseFloat(order.subtotal).toFixed(2).replace('.', ',')}
                            {order.discount && parseFloat(order.discount) > 0
                              ? ` • Desconto: -R$ ${parseFloat(order.discount).toFixed(2).replace('.', ',')}`
                              : ''}
                            {order.shipping_fee
                              ? ` • Entrega: R$ ${parseFloat(order.shipping_fee).toFixed(2).replace('.', ',')}`
                              : ''}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] uppercase tracking-[0.18em] text-[#9e9589]">
                          Total Demonstrativo
                        </span>
                        <span className="font-mono text-2xl font-bold text-[#c9a256]">
                          R$ {parseFloat(order.total).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-11 w-11 rounded-full bg-[#14110e] border border-[#c9a256]/25 flex items-center justify-center text-[#f4efe6] disabled:opacity-30 hover:border-[#c9a256] transition-all cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#9e9589]">
                  Página <strong className="text-[#c9a256]">{page}</strong> de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-11 w-11 rounded-full bg-[#14110e] border border-[#c9a256]/25 flex items-center justify-center text-[#f4efe6] disabled:opacity-30 hover:border-[#c9a256] transition-all cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
