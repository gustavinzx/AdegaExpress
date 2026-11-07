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
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const statusIcons: Record<string, ReactNode> = {
  PENDENTE: <Clock size={18} className="text-amber-500" />,
  CONFIRMADO: <CheckCircle size={18} className="text-blue-400" />,
  SEPARADO: <Package size={18} className="text-indigo-400" />,
  EM_ROTA: <Truck size={18} className="text-orange-400" />,
  ENTREGUE: <CheckCircle size={18} className="text-emerald-400" />,
  CANCELADO: <XCircle size={18} className="text-red-400" />,
};

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente (Aguardando Confirmação)',
  CONFIRMADO: 'Confirmado',
  SEPARADO: 'Separado para Entrega',
  EM_ROTA: 'Em Rota de Entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

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
      toast.success('Pedido cancelado e estoque devolvido.');
      await fetchOrders();
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
        <div className="text-center py-20 font-black tracking-widest uppercase text-amber-500 animate-pulse text-xs">
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen font-sans text-white pb-20">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-8 bg-amber-500" />
            <h1 className="text-2xl md:text-3xl font-serif font-black text-white uppercase tracking-wider">
              Acompanhamento de Pedidos
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void fetchOrders()}
            className="text-xs font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded hover:border-amber-500 transition-colors"
          >
            Atualizar Status
          </button>
        </div>

        <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3 text-xs text-zinc-300">
          <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Pagamento Demonstrativo (Sem Cobrança Real):</strong>{' '}
            Quando você realiza um pedido, o estoque é debitado imediatamente (RN01) e o pagamento
            fica <strong>PENDENTE</strong> até que um Atendente ou Administrador registre a
            confirmação manual na Mesa de Operações. Caso não seja confirmado em 30 minutos, o
            pedido é cancelado automaticamente e os itens retornam ao estoque (RN07).
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 font-black tracking-widest uppercase text-amber-500 animate-pulse text-xs">
            Consultando seus pedidos...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl">
            <p className="text-zinc-400 mb-6 font-bold uppercase tracking-wider text-sm">
              Você ainda não possui pedidos realizados.
            </p>
            <Link
              href="/#catalogo"
              className="inline-block bg-amber-600 text-black font-black uppercase tracking-widest text-xs py-3 px-8 rounded hover:bg-amber-500 transition-colors"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-zinc-800 gap-3">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider text-white">
                      Pedido #{order.id}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Realizado em {new Date(order.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3.5 py-2 rounded-lg">
                    {statusIcons[order.status] || <Clock size={18} className="text-zinc-500" />}
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                </div>

                {/* Etapas Visuais */}
                {order.status !== 'CANCELADO' && (
                  <div className="grid grid-cols-5 gap-1.5 mb-5 text-center text-[10px] font-bold uppercase tracking-wider">
                    {(['PENDENTE', 'CONFIRMADO', 'SEPARADO', 'EM_ROTA', 'ENTREGUE'] as const).map(
                      (step, idx, arr) => {
                        const currentIdx = arr.indexOf(order.status as (typeof arr)[number]);
                        const reached = idx <= currentIdx;
                        return (
                          <div
                            key={step}
                            className={`py-1.5 px-1 rounded border ${
                              reached
                                ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                            }`}
                          >
                            {step.replace('_', ' ')}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}

                {order.cancellation_reason && (
                  <div className="mb-4 p-3 rounded bg-red-950/40 border border-red-900/50 text-xs text-red-300">
                    <strong>Motivo do Cancelamento:</strong> {order.cancellation_reason}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded text-zinc-300">
                        Modalidade Demonstrativa: <strong className="text-amber-500">{order.payment_method}</strong>
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded font-bold ${
                          order.payment_status === 'PAGO'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        Situação do Pagamento: {order.payment_status}
                      </span>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                        Itens Comprados:
                      </p>
                      <ul className="text-xs text-zinc-300 space-y-1">
                        {order.items?.map((item) => (
                          <li key={item.id}>
                            <span className="font-bold text-white">{item.quantity}x</span>{' '}
                            {item.product_name} — R${' '}
                            {Number(item.unit_price).toFixed(2).replace('.', ',')}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {order.status === 'PENDENTE' && (
                      <button
                        type="button"
                        disabled={cancellingId === order.id}
                        onClick={() => void handleCancelOrder(order.id)}
                        className="mt-2 text-[11px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 underline disabled:opacity-50"
                      >
                        {cancellingId === order.id ? 'Cancelando...' : 'Cancelar Pedido Pendente'}
                      </button>
                    )}
                  </div>

                  <div className="text-right bg-zinc-950 px-4 py-3 rounded-lg border border-zinc-800 shrink-0 w-full sm:w-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-0.5">
                      Valor Total
                    </span>
                    <span className="text-xl font-black text-amber-500">
                      R$ {Number(order.total).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-full hover:bg-zinc-800 text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-full hover:bg-zinc-800 text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Próxima página"
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
