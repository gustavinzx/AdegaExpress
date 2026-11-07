'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Address } from '@/types';
import Link from 'next/link';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  MapPin,
  CreditCard,
  Info,
  Droplets,
  CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface QuoteResult {
  subtotal: string;
  discount: string;
  shipping_fee: string;
  total: string;
}

export default function Carrinho() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');

  // Checkout State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARTAO'>('PIX');

  // Quotation State (RF06)
  const [quoteSubtotal, setQuoteSubtotal] = useState<number>(total);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [quoteTotal, setQuoteTotal] = useState<number>(total);
  const [quoteError, setQuoteError] = useState('');

  const fetchAddresses = async () => {
    try {
      const res = await api.get<Address[]>('/addresses');
      setAddresses(res);
      const def = res.find((a) => a.is_default);
      if (def) setSelectedAddressId(def.id);
      else if (res.length > 0) setSelectedAddressId(res[0].id);
    } catch {
      // Address fetch error handled silently or on quote
    }
  };

  const runQuote = async (codeToUse?: string, showSuccessToast = false) => {
    if (!selectedAddressId || items.length === 0) return;
    try {
      setLoading(true);
      const payload: {
        address_id: number;
        payment_method: 'PIX' | 'CARTAO';
        coupon_code?: string;
        items: { product_id: number; quantity: number }[];
      } = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      };
      if (codeToUse?.trim()) {
        payload.coupon_code = codeToUse.trim().toUpperCase();
      }
      const res = await api.post<QuoteResult>('/orders/quote', payload);
      setQuoteSubtotal(Number(res.subtotal));
      setDiscount(Number(res.discount));
      setShippingFee(Number(res.shipping_fee));
      setQuoteTotal(Number(res.total));
      setQuoteError('');
      if (codeToUse?.trim()) {
        setAppliedCoupon(codeToUse.trim().toUpperCase());
        if (showSuccessToast) {
          toast.success('Cupom aplicado com sucesso!');
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao calcular cotação.';
      setQuoteError(msg);
      if (codeToUse) {
        setAppliedCoupon('');
        setDiscount(0);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'CLIENTE') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchAddresses();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const syncQuote = async () => {
      if (isAuthenticated && user?.role === 'CLIENTE' && selectedAddressId && items.length > 0) {
        await runQuote(appliedCoupon || undefined);
      } else {
        await Promise.resolve();
        setQuoteSubtotal(total);
        setShippingFee(0);
        setDiscount(0);
        setQuoteTotal(total);
      }
    };
    void syncQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, total, selectedAddressId, isAuthenticated, user]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (items.length === 0) return;
    if (!selectedAddressId) {
      toast.error('Selecione um endereço de entrega antes de aplicar o cupom.');
      return;
    }
    await runQuote(couponCode, true);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/carrinho');
      return;
    }
    if (user?.role !== 'CLIENTE') {
      toast.error('Apenas contas com perfil CLIENTE podem realizar pedidos.');
      return;
    }
    if (items.length === 0) {
      toast.error('Seu carrinho está vazio!');
      return;
    }
    if (!selectedAddressId) {
      toast.error('Selecione ou cadastre um endereço de entrega.');
      return;
    }

    setLoading(true);

    try {
      const payload: {
        address_id: number;
        payment_method: 'PIX' | 'CARTAO';
        coupon_code?: string;
        items: { product_id: number; quantity: number }[];
      } = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      };

      if (appliedCoupon && !quoteError && discount > 0) {
        payload.coupon_code = appliedCoupon;
      }

      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      await api.post('/orders', payload, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });

      clearCart();
      toast.success(
        'Pedido demonstrativo registrado! Aguardando confirmação manual pela equipe.',
      );
      router.push('/pedidos');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao finalizar pedido.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen font-sans text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-0.5 w-10 bg-amber-500" />
          <h1 className="text-2xl md:text-3xl font-serif font-black text-white uppercase tracking-wider">
            Carrinho & Checkout Demonstrativo
          </h1>
          <div className="h-0.5 flex-1 bg-zinc-800" />
        </div>

        {/* AVISO EXPLÍCITO DE PAGAMENTO DEMONSTRATIVO (RF07 / RNF05) */}
        <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div className="text-xs text-zinc-200 leading-relaxed">
            <strong className="text-amber-400 uppercase tracking-wider block mb-0.5">
              Aviso de Checkout Demonstrativo (Sem Cobrança Real)
            </strong>
            Nesta versão acadêmica (v4.3), a escolha entre <strong>PIX</strong> e{' '}
            <strong>Cartão</strong> funciona apenas como registro demonstrativo no pedido. Nenhuma
            transação bancária, geração de QR Code ou cobrança financeira real é efetuada. Após a
            criação do pedido, um <strong>Atendente ou Administrador</strong> realizará a
            confirmação manual na Mesa de Operações (em até 30 minutos, conforme RN07).
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-xl">
            <p className="text-lg text-zinc-300 mb-2 font-bold uppercase tracking-wider">
              Seu carrinho está vazio
            </p>
            <p className="text-xs text-zinc-500 mb-6">
              Adicione águas, sucos, refrigerantes ou chás do nosso catálogo para simular uma compra.
            </p>
            <Link
              href="/#catalogo"
              className="inline-block bg-amber-600 text-black font-black uppercase tracking-widest text-xs py-3 px-8 rounded hover:bg-amber-500 transition-colors"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* LISTA DE PRODUTOS NO CARRINHO (RF05 / RF17) */}
            <div className="flex-1">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                <ul className="divide-y divide-zinc-800">
                  {items.map((item) => (
                    <li
                      key={item.product.id}
                      className="p-5 flex flex-col sm:flex-row items-center gap-5 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="w-20 h-20 bg-zinc-950 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-zinc-800">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <Droplets size={28} className="text-amber-500" />
                        )}
                      </div>

                      <div className="flex-1 w-full text-center sm:text-left">
                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-0.5">
                          {item.product.brand} • {item.product.volume_ml}ml
                        </p>
                        <Link
                          href={`/produto/${item.product.id}`}
                          className="font-bold text-base text-white hover:text-amber-500 transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-zinc-400 text-xs mt-1">
                          R$ {Number(item.product.price).toFixed(2).replace('.', ',')} / unidade (Estoque:{' '}
                          {item.product.stock_quantity} un.)
                        </p>

                        <div className="flex items-center justify-center sm:justify-start gap-4 mt-3">
                          <div className="flex items-center border border-zinc-700 bg-zinc-950 rounded-md h-9">
                            <button
                              type="button"
                              aria-label="Diminuir quantidade"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-3 hover:bg-zinc-800 text-zinc-300 transition-colors h-full rounded-l-md"
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={item.product.stock_quantity}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!Number.isNaN(val)) {
                                  updateQuantity(item.product.id, val);
                                }
                              }}
                              aria-label={`Quantidade de ${item.product.name}`}
                              className="w-14 text-center font-bold text-white text-xs bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              aria-label="Aumentar quantidade"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-3 hover:bg-zinc-800 text-zinc-300 transition-colors h-full rounded-r-md"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.product.id)}
                            className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                            title="Remover item"
                            aria-label={`Remover ${item.product.name}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="text-right sm:w-32 bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase font-black tracking-widest">
                          Subtotal
                        </span>
                        <span className="font-black text-base text-amber-500">
                          R$ {(Number(item.product.price) * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* PAINEL DE FINALIZAÇÃO (UC01 / UC06) */}
            <div className="w-full lg:w-96">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-24 shadow-xl">
                <h2 className="text-lg font-black text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                  <ArrowRight size={18} className="text-amber-500" /> Resumo & Finalização
                </h2>

                {/* ENDEREÇO DE ENTREGA (UC14 / RN10) */}
                <div className="mb-5">
                  <label
                    htmlFor="checkout-address"
                    className="block text-[11px] font-black text-zinc-300 uppercase tracking-widest mb-2 flex items-center gap-1.5"
                  >
                    <MapPin size={13} className="text-amber-500" /> Endereço de Entrega
                  </label>
                  {isAuthenticated ? (
                    addresses.length > 0 ? (
                      <div className="space-y-2">
                        <select
                          id="checkout-address"
                          value={selectedAddressId || ''}
                          onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                          className="w-full border border-zinc-700 rounded-md px-3 py-2.5 bg-zinc-950 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          {addresses.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.is_default ? '[Padrão] ' : ''}
                              {a.street}, {a.number} — {a.neighborhood} ({a.city}/{a.state})
                            </option>
                          ))}
                        </select>
                        <Link
                          href="/perfil?tab=ENDERECOS"
                          className="inline-block text-[11px] text-amber-500 hover:underline font-semibold"
                        >
                          + Gerenciar ou cadastrar novo endereço
                        </Link>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-md border border-amber-500/30">
                        Você ainda não possui endereço ativo cadastrado.{' '}
                        <Link href="/perfil?tab=ENDERECOS" className="underline font-bold">
                          Clique aqui para cadastrar em Meu Perfil
                        </Link>
                        .
                      </div>
                    )
                  ) : (
                    <div className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-md border border-zinc-800">
                      <Link href="/login?redirect=/carrinho" className="text-amber-500 font-bold underline">
                        Entre na sua conta
                      </Link>{' '}
                      para selecionar o endereço e calcular o frete.
                    </div>
                  )}
                </div>

                {/* MODALIDADE DE PAGAMENTO DEMONSTRATIVO (RF07) */}
                <div className="mb-5">
                  <span className="block text-[11px] font-black text-zinc-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <CreditCard size={13} className="text-amber-500" /> Modalidade Demonstrativa
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-md border text-xs transition-all ${
                        paymentMethod === 'PIX'
                          ? 'bg-amber-600/15 border-amber-500 text-amber-400 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-black uppercase">PIX</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">Simulado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARTAO')}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-md border text-xs transition-all ${
                        paymentMethod === 'CARTAO'
                          ? 'bg-amber-600/15 border-amber-500 text-amber-400 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-black uppercase">Cartão</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">Simulado</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-snug">
                    Nenhum dado bancário ou de cartão é solicitado. O pagamento permanece{' '}
                    <strong>PENDENTE</strong> até conferência manual por Atendente ou Administrador.
                  </p>
                </div>

                {/* CUPOM DE DESCONTO (UC06 / RF08) */}
                <div className="mb-5">
                  <label
                    htmlFor="checkout-coupon"
                    className="block text-[11px] font-black text-zinc-300 uppercase tracking-widest mb-2"
                  >
                    Cupom de Desconto (Opcional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="checkout-coupon"
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 border border-zinc-700 rounded-md px-3 py-2 text-xs bg-zinc-950 text-white focus:outline-none focus:border-amber-500 uppercase"
                      placeholder="EX: BEMVINDO10"
                    />
                    <button
                      type="button"
                      onClick={() => void applyCoupon()}
                      disabled={!couponCode.trim() || loading}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 rounded-md transition-colors disabled:opacity-50 border border-zinc-700"
                    >
                      Aplicar
                    </button>
                  </div>
                  {appliedCoupon && discount > 0 && (
                    <div className="flex items-center justify-between text-emerald-400 text-xs mt-1.5 font-semibold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={13} /> Cupom {appliedCoupon} ativo
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCouponCode('');
                          setAppliedCoupon('');
                          void runQuote('');
                        }}
                        className="text-zinc-400 hover:text-red-400 underline text-[11px]"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>

                {quoteError && (
                  <div className="mb-4 p-3 rounded bg-red-950/50 border border-red-800 text-red-300 text-xs font-semibold">
                    {quoteError}
                  </div>
                )}

                {/* VALORES CALCULADOS NO SERVIDOR (RF06) */}
                <div className="space-y-2.5 mb-6 bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal dos Itens</span>
                    <span>R$ {quoteSubtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Frete Fixo Local</span>
                    <span>R$ {shippingFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Desconto ({appliedCoupon})</span>
                      <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                    <span className="font-black text-white uppercase tracking-wider text-sm">
                      Total do Pedido
                    </span>
                    <span className="text-xl font-black text-amber-500">
                      R$ {quoteTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleCheckout()}
                  disabled={loading || (isAuthenticated && (!selectedAddressId || !!quoteError))}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest text-xs py-4 rounded flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading
                    ? 'Registrando Pedido...'
                    : isAuthenticated
                      ? 'Confirmar Pedido Demonstrativo'
                      : 'Entrar para Finalizar Compra'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
