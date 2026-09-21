'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const statusIcons: Record<string, any> = {
  PENDENTE: <Clock size={20} className="text-amber-500" />,
  CONFIRMADO: <CheckCircle size={20} className="text-blue-500" />,
  SEPARADO: <Package size={20} className="text-indigo-500" />,
  EM_ROTA: <Truck size={20} className="text-orange-500" />,
  ENTREGUE: <CheckCircle size={20} className="text-green-500" />,
  CANCELADO: <XCircle size={20} className="text-red-500" />,
};

const statusLabels: Record<string, string> = {
  PENDENTE: 'Aguardando Confirmação',
  CONFIRMADO: 'Pedido Confirmado',
  SEPARADO: 'Pronto para Entrega',
  EM_ROTA: 'Em Rota de Entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export default function Pedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPixModal, setShowPixModal] = useState<number | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;
  
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/pedidos');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getPaginated<Order[]>(`/orders/me?page=${page}&limit=${limit}`);
      setOrders(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return (
    <div className="bg-zinc-950 min-h-screen text-white"><Navbar /><div className="text-center py-20 font-black tracking-widest uppercase text-amber-500 animate-pulse">Carregando...</div></div>
  );

  return (
    <div className="bg-zinc-950 min-h-screen font-sans text-white pb-20">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-0.5 w-12 bg-amber-600"></div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest drop-shadow-xl">Meus Pedidos</h1>
          <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-amber-600/50"></div>
        </div>

        {loading ? (
          <div className="text-center py-20 font-black tracking-widest uppercase text-amber-500 animate-pulse">Sincronizando pedidos...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl">
            <p className="text-zinc-500 mb-6 font-bold uppercase tracking-widest">Você ainda não fez nenhum pedido.</p>
            <Link href="/" className="inline-block bg-amber-600 text-black font-black uppercase tracking-widest py-3 px-8 rounded-sm hover:bg-amber-500 transition-colors">
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl hover:border-amber-500/50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-zinc-800">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-white">Pedido #{order.id}</h3>
                    <p className="text-[10px] uppercase font-bold text-zinc-500">
                      {new Date(order.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center space-x-2 bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-lg">
                    {statusIcons[order.status] || <Clock size={20} className="text-zinc-500" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{statusLabels[order.status] || order.status}</span>
                  </div>
                </div>
                

                <div className="flex justify-between items-end mt-4">
                  <div>
                    <p className="text-[10px] text-amber-500 uppercase font-black tracking-widest mb-2">Pgto: {order.payment_method}</p>
                    <div className="text-xs text-zinc-400 mb-2 font-bold uppercase tracking-widest">
                       {order.items?.map((item: any) => (
                          <div key={item.id} className="text-zinc-300">
                             <span className="font-black text-white">{item.quantity}x</span> {item.product_name}
                          </div>
                       ))}
                    </div>
                    {order.payment_method === 'PIX' && order.payment_status !== 'PAGO' && order.status !== 'CANCELADO' && (
                       <button onClick={() => setShowPixModal(order.id)} className="mt-2 bg-amber-600 hover:bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded transition-colors flex items-center gap-1">
                          Ver QR Code PIX
                       </button>
                    )}
                  </div>

                  <div className="text-right bg-zinc-950 px-4 py-2 rounded-lg border border-zinc-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">
                       Total
                    </span>
                    <span className="text-xl font-black text-amber-500">
                      R$ {Number(order.total).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-12">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-3 bg-zinc-900 border border-zinc-700 rounded-full hover:bg-zinc-800 text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Página {page} de {totalPages}</span>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-3 bg-zinc-900 border border-zinc-700 rounded-full hover:bg-zinc-800 text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      
        {showPixModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full p-6 text-center shadow-2xl relative">
                <button onClick={() => setShowPixModal(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                  <XCircle size={24} />
                </button>
                <h2 className="text-xl font-black uppercase text-white tracking-widest mb-2">Pague com PIX</h2>
                <p className="text-xs text-zinc-400 mb-6">Escaneie o QR Code abaixo pelo app do seu banco para confirmar o pedido #{showPixModal}.</p>
                
                <div className="bg-white p-4 rounded-lg inline-block mb-6 shadow-inner">
                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014br.gov.bcb.pix0136random-uuid-adega-express-${showPixModal}5204000053039865802BR5913Adega Express6008Brasilia62070503***6304`} alt="QR Code PIX" className="w-48 h-48" />
                </div>
                
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded text-left mb-6">
                   <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">PIX Copia e Cola (Simulação)</p>
                   <p className="text-xs text-zinc-300 font-mono break-all line-clamp-2">00020126580014br.gov.bcb.pix0136random-uuid-adega-express-5204000053039865802BR5913Adega Express...</p>
                </div>
                
                <div className="text-[10px] text-amber-500 font-bold uppercase">
                  Assim que pagar, o administrador do sistema confirmará seu pagamento no Painel de Controle.
                </div>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}
