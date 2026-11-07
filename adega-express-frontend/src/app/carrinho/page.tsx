'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProductArtwork from '@/components/ProductArtwork';
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

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARTAO'>('PIX');

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
      // Address fetch error handled on quote
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
          toast.success('Cupom aplicado!');
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
    if (!couponCode.trim() || items.length === 0) return;
    if (!selectedAddressId) {
      toast.error('Selecione um endereço de entrega antes de aplicar o cupom.');
      return;
    }
    await runQuote(couponCode, true);
  };

  const removeCoupon = async () => {
    setCouponCode('');
    setAppliedCoupon('');
    setDiscount(0);
    await runQuote(undefined, false);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login como Cliente para finalizar sua compra.');
      router.push('/login?redirect=/carrinho');
      return;
    }

    if (user?.role !== 'CLIENTE') {
      toast.error('Apenas contas com perfil CLIENTE podem realizar pedidos.');
      return;
    }

    if (!selectedAddressId) {
      toast.error('Selecione ou cadastre um endereço de entrega.');
      return;
    }

    const outOfStockItem = items.find(
      (i) => !i.product.in_stock || i.product.stock_quantity < i.quantity,
    );
    if (outOfStockItem) {
      toast.error(
        `O item "${outOfStockItem.product.name}" não possui estoque suficiente (${outOfStockItem.product.stock_quantity} un.).`,
      );
      return;
    }

    try {
      setLoading(true);
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

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
      if (appliedCoupon) {
        payload.coupon_code = appliedCoupon;
      }

      await api.post('/orders', payload, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });

      clearCart();
      toast.success('Pedido registrado! Aguarde a confirmação do pagamento pela loja.');
      router.push('/pedidos');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erro ao registrar pedido.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-white font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-serif font-black uppercase tracking-wider mb-6 border-b border-zinc-800 pb-4">
          Carrinho de Compras
        </h1>

        <div className="mb-8 rounded-xl border border-amber-500/30 bg-zinc-900 p-4 flex items-start gap-3 text-xs text-zinc-300">
          <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">
              Pagamento Demonstrativo (Sem Cobrança Real)
            </strong>
            A forma de pagamento escolhida (PIX ou Cartão) é registrada apenas para fins
            demonstrativos. Nenhuma cobrança financeira real é realizada. A confirmação é feita
            manualmente pela equipe da loja.
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-zinc-400 text-base mb-6">Seu carrinho está vazio.</p>
            <Link
              href="/#catalogo"
              className="inline-block bg-amber-600 text-black font-black uppercase tracking-widest px-8 py-3 rounded hover:bg-amber-500 transition-colors text-xs"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* Items */}
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-amber-500 border-b border-zinc-800 pb-3">
                  1. Itens do Pedido
                </h2>

                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-zinc-800/60 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="w-16 h-20 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                      <ProductArtwork
                        name={item.product.name}
                        brand={item.product.brand}
                        categoryName={item.product.category?.name}
                        volumeMl={item.product.volume_ml}
                        imageUrl={item.product.image_url}
                        size="sm"
                      />
                    </div>

                    <div className="flex-1">
                      <Link
                        href={`/produto/${item.product.id}`}
                        className="font-bold text-sm text-white hover:text-amber-500"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        {item.product.brand} • {item.product.volume_ml}mL • R${' '}
                        {parseFloat(item.product.price).toFixed(2).replace('.', ',')} un.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-2 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-3 font-bold text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-2 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <span className="font-black text-amber-500 text-sm min-w-[80px] text-right">
                        R${' '}
                        {(parseFloat(item.product.price) * item.quantity)
                          .toFixed(2)
                          .replace('.', ',')}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="text-zinc-500 hover:text-red-500 p-1.5 cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Address */}
              {isAuthenticated && user?.role === 'CLIENTE' && (
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                  <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
                    <h2 className="text-sm font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                      <MapPin size={16} /> 2. Endereço de Entrega
                    </h2>
                    <Link
                      href="/perfil?tab=ENDERECOS"
                      className="text-xs font-bold text-amber-500 hover:underline"
                    >
                      Gerenciar Endereços
                    </Link>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-zinc-400 mb-3">
                        Nenhum endereço de entrega cadastrado.
                      </p>
                      <Link
                        href="/perfil?tab=ENDERECOS"
                        className="inline-block bg-amber-600 text-black font-bold text-xs uppercase px-4 py-2 rounded"
                      >
                        Cadastrar Endereço
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedAddressId === addr.id
                              ? 'border-amber-500 bg-zinc-950'
                              : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs text-white">
                              {addr.street}, {addr.number}
                            </span>
                            {selectedAddressId === addr.id && (
                              <CheckCircle2 size={15} className="text-amber-500" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">
                            {addr.neighborhood} — {addr.city}/{addr.state}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">CEP {addr.zip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Payment */}
              {isAuthenticated && user?.role === 'CLIENTE' && (
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                  <h2 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-4 border-b border-zinc-800 pb-3 flex items-center gap-2">
                    <CreditCard size={16} /> 3. Forma de Pagamento (Demonstrativa)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                        paymentMethod === 'PIX'
                          ? 'border-amber-500 bg-zinc-950 text-amber-500'
                          : 'border-zinc-800 bg-zinc-950/50 text-zinc-300'
                      }`}
                    >
                      <span className="font-bold text-xs uppercase block">PIX (Demonstrativo)</span>
                      <span className="text-[11px] text-zinc-400">
                        Sem geração de QR Code ou cobrança real.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARTAO')}
                      className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                        paymentMethod === 'CARTAO'
                          ? 'border-amber-500 bg-zinc-950 text-amber-500'
                          : 'border-zinc-800 bg-zinc-950/50 text-zinc-300'
                      }`}
                    >
                      <span className="font-bold text-xs uppercase block">
                        Cartão (Demonstrativo)
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Sem cobrança bancária real.
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="lg:col-span-4">
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 sticky top-28 space-y-5">
                <h2 className="text-base font-serif font-black uppercase tracking-wider border-b border-zinc-800 pb-3">
                  Resumo do Pedido
                </h2>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Cupom de Desconto
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="CÓDIGO"
                      className="flex-1 h-10 bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-xs uppercase text-white focus:outline-none focus:border-amber-500"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={() => void removeCoupon()}
                        className="h-10 px-3 rounded-lg bg-red-950 border border-red-700/50 text-red-200 text-xs font-bold uppercase cursor-pointer"
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void applyCoupon()}
                        className="h-10 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-500 text-xs font-bold uppercase cursor-pointer"
                      >
                        Aplicar
                      </button>
                    )}
                  </div>
                </div>

                {quoteError && (
                  <div className="rounded-lg bg-red-950/60 border border-red-700/50 p-3 text-xs text-red-200">
                    {quoteError}
                  </div>
                )}

                <div className="space-y-2.5 text-xs border-t border-zinc-800 pt-4">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span className="text-white font-bold">
                      R$ {quoteSubtotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Desconto</span>
                      <span className="font-bold">- R$ {discount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-400">
                    <span>Taxa de Entrega</span>
                    <span className="text-white font-bold">
                      {selectedAddressId
                        ? `R$ ${shippingFee.toFixed(2).replace('.', ',')}`
                        : 'Selecione o endereço'}
                    </span>
                  </div>
                  <div className="border-t border-zinc-800 pt-3 flex justify-between items-baseline text-base font-black">
                    <span>Total</span>
                    <span className="text-amber-500 text-xl">
                      R$ {quoteTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading || !!quoteError}
                  onClick={() => void handleCheckout()}
                  className="w-full h-12 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span>
                    {loading
                      ? 'Processando...'
                      : isAuthenticated
                        ? 'Finalizar Pedido'
                        : 'Entrar para Finalizar'}
                  </span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
