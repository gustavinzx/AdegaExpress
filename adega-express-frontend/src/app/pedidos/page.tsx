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
  History,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const statusIcons: Record<string, ReactNode> = {
  PENDENTE: <Clock size={15} className="text-amber-600" />,
  CONFIRMADO: <CheckCircle size={15} className="text-teal-600" />,
  SEPARADO: <Package size={15} className="text-indigo-600" />,
  EM_ROTA: <Truck size={15} className="text-blue-600" />,
  ENTREGUE: <CheckCircle size={15} className="text-emerald-600" />,
  CANCELADO: <XCircle size={15} className="text-rose-600" />,
};

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente (Aguardando Validação)',
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
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Cancellation modal state
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Desistência da compra');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const fetchOrders = async (targetPage = page, silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const res = await api.getPaginated<Order[]>(`/orders/me?page=${targetPage}&limit=${limit}`);
      setOrders(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages);
      }
    } catch {
      toast.error('Erro ao consultar histórico de pedidos.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/pedidos');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchOrders(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, page]);

  const confirmCancelOrder = async () => {
    if (!modalOrder) return;
    const orderId = modalOrder.id;
    const reason = cancelReason.trim() || 'Desistência da compra';

    // Optimistic UI Update: update immediately in local state
    setModalOrder(null);
    setCancellingId(orderId);
    const previousOrders = [...orders];

    setOrders((current) =>
      current.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'CANCELADO' as Order['status'],
              cancellation_reason: reason,
              history: o.history
                ? [
                    ...o.history,
                    {
                      id: Date.now(),
                      order_id: orderId,
                      status: 'CANCELADO',
                      actor_id: 0,
                      reason,
                      created_at: new Date().toISOString(),
                    },
                  ]
                : undefined,
            }
          : o,
      ),
    );

    try {
      await api.post(`/orders/${orderId}/cancel`, { reason });
      toast.success('Pedido cancelado e estoque devolvido com sucesso.');
      // Silently refresh in background without re-rendering skeletons
      await fetchOrders(page, true);
    } catch (e: unknown) {
      setOrders(previousOrders);
      const msg = e instanceof Error ? e.message : 'Erro ao cancelar pedido.';
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
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

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-900 font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Minhas Compras
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-0.5">
              Meus Pedidos
            </h1>
          </div>
          <Link
            href="/#catalogo"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
          >
            Realizar novo pedido →
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3 text-xs text-slate-700">
          <Info size={16} className="text-amber-800 shrink-0 mt-0.5" />
          <span>
            Pedidos com status <strong>PENDENTE</strong> aguardam validação do pagamento demonstrativo.
            Caso não confirmados em até <strong>30 minutos</strong>, expiram automaticamente liberando os itens ao estoque.
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-48 rounded-2xl border border-slate-200 bg-white animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 px-6 shadow-xs">
            <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-4">
              <Package size={24} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">
              Você ainda não realizou pedidos
            </h2>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              Explore nossa seleção de águas minerais, sucos, refrigerantes e chás.
            </p>
            <Link
              href="/#catalogo"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs"
            >
              <span>Ir às Compras</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const stepIdx = ORDER_STEPS.findIndex((s) => s.key === order.status);
              const isExpanded = expandedOrderId === order.id;

              return (
                <article
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                >
                  {/* Order Header */}
                  <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          Pedido #{order.id}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {new Date(order.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-800">
                        {statusIcons[order.status]}
                        <span>{statusLabels[order.status] || order.status}</span>
                      </div>

                      <div
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          order.payment_status === 'PAGO'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {order.payment_method}: {order.payment_status}
                      </div>

                      {order.status === 'PENDENTE' && (
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => {
                            setModalOrder(order);
                            setCancelReason('Desistência da compra');
                          }}
                          className="h-8 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {cancellingId === order.id ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Cancelando...</span>
                            </>
                          ) : (
                            <span>Cancelar</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 5-Stage Stepper */}
                  {order.status !== 'CANCELADO' ? (
                    <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100">
                      <div className="grid grid-cols-5 gap-2">
                        {ORDER_STEPS.map((st, idx) => {
                          const done = stepIdx >= idx;
                          return (
                            <div key={st.key} className="flex flex-col gap-1">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
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
                      <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 font-medium">
                        <strong>Motivo do cancelamento:</strong> {order.cancellation_reason}
                      </div>
                    )
                  )}

                  {/* Order Items & Totals */}
                  <div className="p-5">
                    <div className="divide-y divide-slate-100 mb-4">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                              {item.quantity}x
                            </span>
                            <span className="font-semibold text-slate-800">
                              {item.product_name ||
                                item.product?.name ||
                                `Produto #${item.product_id}`}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900">
                            R${' '}
                            {(parseFloat(item.unit_price) * item.quantity)
                              .toFixed(2)
                              .replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex flex-wrap justify-between items-end gap-3">
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500">
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
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOrderId(isExpanded ? null : order.id)
                            }
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
                          >
                            <History size={13} />
                            <span>
                              {isExpanded ? 'Ocultar Histórico' : 'Ver Histórico & Detalhes'}
                            </span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>

                          <Link
                            href={`/pedidos/${order.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-teal-700 transition-colors"
                          >
                            <span>Abrir Página de Detalhes</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">
                          Total do Pedido
                        </span>
                        <span className="text-xl font-extrabold text-teal-800">
                          R$ {parseFloat(order.total).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    {/* Expanded History */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {order.address_snapshot && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                              <MapPin size={12} /> Endereço de Entrega
                            </span>
                            <p className="text-xs font-bold text-slate-900">
                              {order.address_snapshot.street}, {order.address_snapshot.number}
                              {order.address_snapshot.complement
                                ? ` — ${order.address_snapshot.complement}`
                                : ''}
                            </p>
                            <p className="text-xs text-slate-500">
                              {order.address_snapshot.neighborhood} • {order.address_snapshot.city}/{order.address_snapshot.state} (CEP {order.address_snapshot.zip})
                            </p>
                          </div>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                            <History size={12} /> Histórico de Alterações
                          </span>
                          {order.history && order.history.length > 0 ? (
                            <ol className="space-y-1.5 border-l border-slate-200 ml-1.5 pl-3">
                              {order.history.map((h) => (
                                <li key={h.id} className="relative text-xs">
                                  <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-teal-600" />
                                  <div className="flex items-center justify-between gap-2">
                                    <strong className="text-slate-800 uppercase text-[11px]">
                                      {h.status}
                                    </strong>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(h.created_at).toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                  {h.reason && (
                                    <p className="text-slate-500 text-[11px] mt-0.5">{h.reason}</p>
                                  )}
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="text-xs text-slate-500">
                              Criado em {new Date(order.created_at).toLocaleString('pt-BR')}.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-30 hover:border-slate-300 transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-slate-500">
                  Página <strong className="text-teal-700">{page}</strong> de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-30 hover:border-slate-300 transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal de Confirmação de Cancelamento com Visual Polido */}
        {modalOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
          >
            <div
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                      Ação com retorno ao estoque
                    </span>
                    <h2 id="cancel-modal-title" className="text-lg font-extrabold text-slate-900">
                      Cancelar Pedido #{modalOrder.id}?
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOrder(null)}
                  className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Tem certeza de que deseja cancelar este pedido? Os itens reservados serão imediatamente devolvidos ao estoque da adega.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="cancel-reason-input" className="block text-xs font-bold text-slate-700">
                  Motivo do Cancelamento
                </label>
                <input
                  id="cancel-reason-input"
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Desistência da compra"
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-600 transition-all"
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  {cancelReason.length}/120 caracteres
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOrder(null)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!cancelReason.trim() || cancellingId === modalOrder.id}
                  onClick={() => void confirmCancelOrder()}
                  className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {cancellingId === modalOrder.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Cancelando...</span>
                    </>
                  ) : (
                    <span>Confirmar Cancelamento</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
