'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowRight, MapPin, CreditCard, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Address {
  id: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
}

export default function Carrinho() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  
  // Checkout State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARTAO'>('PIX');
  
  // Quotation State
  const [quoteTotal, setQuoteTotal] = useState<number>(total);
  const [discount, setDiscount] = useState<number>(0);
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  // Atualiza a cotação sempre que itens mudarem ou cupom for digitado (com debounce manual no botão aplicar)
  useEffect(() => {
    setQuoteTotal(total);
    setDiscount(0);
    setQuoteError('');
  }, [items, total]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get<Address[]>('/addresses');
      setAddresses(res);
      const def = res.find(a => a.is_default);
      if (def) setSelectedAddressId(def.id);
      else if (res.length > 0) setSelectedAddressId(res[0].id);
    } catch (error) {
      console.error('Erro ao buscar endereços', error);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (items.length === 0) return;
    if (!selectedAddressId) {
      toast.error('Selecione um endereço antes de aplicar o cupom.');
      return;
    }
    
    try {
      setLoading(true);
      const payload = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        coupon_code: couponCode,
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity }))
      };
      const res = await api.post<any>('/orders/quote', payload);
      // Se a cotação der sucesso:
      setQuoteTotal(res.total);
      setDiscount(total - res.total);
      toast.success('Cupom aplicado!');
      setQuoteError('');
    } catch (e: any) {
      setQuoteError(e.message || 'Cupom inválido.');
      setDiscount(0);
      setQuoteTotal(total);
      toast.error('Erro ao aplicar cupom');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/carrinho');
      return;
    }
    if (items.length === 0) {
      toast.error('Seu carrinho está vazio!');
      return;
    }
    if (!selectedAddressId) {
      toast.error('Selecione ou adicione um endereço de entrega!');
      return;
    }

    setLoading(true);
    
    try {
      const payload: any = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity }))
      };

      if (couponCode && !quoteError && discount > 0) {
        payload.coupon_code = couponCode;
      }

      // Idempotency-Key
      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);

      const res = await api.post<any>('/orders', payload, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });
      
      clearCart();
      toast.success('Pedido confirmado com sucesso!');
      router.push('/pedidos');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao finalizar pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="bg-zinc-950 min-h-screen font-sans overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          <div className="flex items-center gap-4 mb-10">
            <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-amber-600/50"></div>
            <h1 className="text-3xl font-black text-white uppercase tracking-widest drop-shadow-xl">Checkout</h1>
            <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-amber-600/50"></div>
          </div>

          {items.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-2xl">
              <p className="text-xl text-zinc-400 mb-6 font-bold uppercase tracking-widest">Seu carrinho está vazio.</p>
              <Link href="/" className="inline-block bg-amber-600 text-black font-black uppercase tracking-widest py-3 px-8 rounded-sm hover:bg-amber-500 transition-colors">
                Ver Catálogo
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* LISTA DE PRODUTOS */}
              <div className="flex-1">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                  <ul className="divide-y divide-zinc-800">
                    {items.map((item) => (
                      <li key={item.product.id} className="p-6 flex flex-col sm:flex-row items-center gap-6 group hover:bg-zinc-800/50 transition-colors">
                        <div className="w-24 h-24 bg-white rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-zinc-200">
                          {item.product.image_url ? (
                            <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-contain p-2" />
                          ) : (
                            <span className="text-xs font-black text-black">LABEL</span>
                          )}
                        </div>
                        
                        <div className="flex-1 w-full text-center sm:text-left">
                          <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-1">{item.product.brand}</p>
                          <Link href={`/produto/${item.product.id}`} className="font-bold text-lg text-white hover:text-amber-500 line-clamp-1 transition-colors">
                            {item.product.name}
                          </Link>
                          <p className="text-zinc-400 font-medium mt-1">
                            R$ {Number(item.product.price).toFixed(2).replace('.', ',')} / un
                          </p>
                          
                          <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                            <div className="flex items-center border border-zinc-700 bg-zinc-950 rounded-md h-9">
                              <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-3 hover:bg-zinc-800 text-zinc-400 transition-colors h-full rounded-l-md">
                                <Minus size={14} />
                              </button>
                              <span className="w-10 text-center font-bold text-white text-sm">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-3 hover:bg-zinc-800 text-zinc-400 transition-colors h-full rounded-r-md">
                                <Plus size={14} />
                              </button>
                            </div>
                            <button onClick={() => removeItem(item.product.id)} className="text-zinc-500 hover:text-red-500 transition-colors" title="Remover item">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-right sm:w-32 bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
                          <span className="text-[10px] text-zinc-500 block mb-1 uppercase font-black tracking-widest">Subtotal</span>
                          <span className="font-black text-lg text-amber-500">
                            R$ {(Number(item.product.price) * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CHECKOUT PAINEL LATERAL */}
              <div className="w-full lg:w-96">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-24 shadow-2xl">
                  <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ArrowRight className="text-amber-500" /> Finalizar Pedido
                  </h2>
                  
                  {/* ENDEREÇO */}
                  <div className="mb-6">
                    <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <MapPin size={12} className="text-amber-500" /> Endereço de Entrega
                    </label>
                    {isAuthenticated ? (
                      addresses.length > 0 ? (
                        <select 
                          value={selectedAddressId || ''}
                          onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                          className="w-full border border-zinc-700 rounded-md px-3 py-2.5 bg-zinc-950 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                        >
                          {addresses.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.street}, {a.number} - {a.neighborhood}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-amber-500 bg-amber-500/10 p-3 rounded-md border border-amber-500/20">
                          Você não tem endereços cadastrados. Vá ao seu perfil para adicionar.
                        </div>
                      )
                    ) : (
                      <div className="text-sm text-zinc-500 bg-zinc-950 p-3 rounded-md border border-zinc-800">
                        Faça login para selecionar o endereço.
                      </div>
                    )}
                  </div>

                  {/* PAGAMENTO */}
                  <div className="mb-6">
                    <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <CreditCard size={12} className="text-amber-500" /> Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setPaymentMethod('PIX')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-md border transition-all ${paymentMethod === 'PIX' ? 'bg-amber-600/10 border-amber-500 text-amber-500 font-bold' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                      >
                        <QrCode size={16} /> PIX
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('CARTAO')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-md border transition-all ${paymentMethod === 'CARTAO' ? 'bg-amber-600/10 border-amber-500 text-amber-500 font-bold' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                      >
                        <CreditCard size={16} /> Cartão
                      </button>
                    </div>
                  </div>
                  
                  {/* CUPOM */}
                  <div className="mb-6">
                    <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2">Cupom de Desconto (Opcional)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 border border-zinc-700 rounded-md px-3 py-2 text-sm bg-zinc-950 text-white focus:outline-none focus:border-amber-500 uppercase"
                        placeholder="EX: ADEGA10"
                      />
                      <button 
                        onClick={applyCoupon}
                        disabled={!couponCode || loading}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 rounded-md transition-colors disabled:opacity-50 border border-zinc-700"
                      >
                        APLICAR
                      </button>
                    </div>
                    {quoteError && <p className="text-red-500 text-xs mt-1 font-medium">{quoteError}</p>}
                    {discount > 0 && <p className="text-green-500 text-xs mt-1 font-medium">Cupom aplicado com sucesso!</p>}
                  </div>

                  {/* RESUMO */}
                  <div className="space-y-3 mb-6 bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                    <div className="flex justify-between text-zinc-400 text-sm">
                      <span>Subtotal Itens</span>
                      <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-500 text-sm font-bold">
                        <span>Desconto</span>
                        <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                      <span className="font-black text-white uppercase tracking-widest">Total</span>
                      <span className="text-2xl font-black text-amber-500">
                        R$ {quoteTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={loading || !selectedAddressId && isAuthenticated}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest py-4 rounded-sm flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-amber-600/20"
                  >
                    {loading ? 'Processando...' : (
                      isAuthenticated ? 'Confirmar Pedido' : 'Fazer Login para Comprar'
                    )}
                  </button>
                  <p className="text-center text-[10px] text-zinc-500 mt-4 uppercase tracking-widest">
                    Compra segura e criptografada
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </>
  );
}
