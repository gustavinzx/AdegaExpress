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
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const statusIcons: Record<string, ReactNode> = {
  PENDENTE: <Clock size={16} className="text-amber-500" />,
  CONFIRMADO: <CheckCircle size={16} className="text-sky-400" />,
  SEPARADO: <Package size={16} className="text-violet-400" />,
  EM_ROTA: <Truck size={16} className="text-amber-400" />,
  ENTREGUE: <CheckCircle size={16} className="text-emerald-400" />,
  CANCELADO: <XCircle size={16} className="text-red-400" />,
};

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  SEPARADO: 'Separado',
  EM_ROTA: 'Em Rota',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const ORDER_STEPS = [
  { key: 'PENDENTE', label: 'Pendente' },
  { key: 'CONFIRMADO', label: 'Confirmado' },
  { key: 'SEPARADO', label: 'Separado' },
  { key: 'EM_ROTA', label: 'Em Rota' },
  { key: 'ENTREGUE', label: 'Entregue' },
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
      toast.error('Erro ao consultar pedidos.');
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
      toast.success('Pedido cancelado.');
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
      <div className="bg-zinc-950 min-h-screen text-white">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen text-white font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-serif font-black uppercase tracking-wider mb-8 border-b border-zinc-800 pb-4">
          Meus Pedidos
        </h1>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-48 rounded-xl border border-zinc-800 bg-zinc-900 animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-zinc-400 text-base mb-6">Você ainda não realizou nenhum pedido.</p>
            <Link
              href="/#catalogo"
              className="inline-block bg-amber-600 text-black font-black uppercase tracking-widest px-8 py-3 rounded hover:bg-amber-500 transition-colors text-xs"
            >
              Ir às Compras
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const stepIdx = ORDER_STEPS.findIndex((s) => s.key === order.status);

              return (
                <div
                  key={order.id}
                  className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
                >
                  <div className="bg-black/40 px-6 py-4 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                        Pedido #{order.id}
                      </span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="inline-flex items-center gap-2 bg-zinc-950 px-3 py-1 rounded border border-zinc-800">
                        {statusIcons[order.status]}
                        <span className="font-bold text-xs text-white">
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>

                      <div
                        className={`px-3 py-1 rounded border text-xs font-bold ${
                          order.payment_status === 'PAGO'
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        {order.payment_method}: {order.payment_status}
                      </div>

                      {order.status === 'PENDENTE' && (
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => void handleCancelOrder(order.id)}
                          className="h-8 px-3 rounded bg-red-950/60 hover:bg-red-900 border border-red-700/50 text-red-200 text-xs font-bold uppercase cursor-pointer"
                        >
                          {cancellingId === order.id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </div>

                  {order.status !== 'CANCELADO' && (
                    <div className="px-6 py-3 bg-zinc-950/60 border-b border-zinc-800">
                      <div className="grid grid-cols-5 gap-2">
                        {ORDER_STEPS.map((st, idx) => {
                          const done = stepIdx >= idx;
                          return (
                            <div key={st.key} className="flex flex-col gap-1">
                              <div
                                className={`h-1 rounded-full ${
                                  done ? 'bg-amber-500' : 'bg-zinc-800'
                                }`}
                              />
                              <span
                                className={`text-[10px] uppercase tracking-wider ${
                                  done ? 'text-amber-500 font-bold' : 'text-zinc-600'
                                }`}
                              >
                                {st.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="divide-y divide-zinc-800/60 mb-4">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center text-sm"
                        >
                          <span className="text-zinc-200">
                            <strong className="text-amber-500 mr-2">{item.quantity}x</strong>
                            {item.product_name ||
                              item.product?.name ||
                              `Produto #${item.product_id}`}
                          </span>
                          <span className="font-bold text-white">
                            R${' '}
                            {(parseFloat(item.unit_price) * item.quantity)
                              .toFixed(2)
                              .replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-zinc-800 pt-3 flex justify-between items-center">
                      <span className="text-xs uppercase tracking-wider text-zinc-400">
                        Total do Pedido
                      </span>
                      <span className="text-xl font-black text-amber-500">
                        R$ {parseFloat(order.total).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Página <strong className="text-amber-500">{page}</strong> de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white disabled:opacity-30 cursor-pointer"
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
