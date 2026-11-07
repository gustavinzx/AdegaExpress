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
  ShoppingBag,
  Tag,
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

  // Quotation State
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
          toast.success('Cupom promocional aplicado!');
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
      toast.success(
        'Pedido registrado com status PENDENTE! Aguarde a confirmação do pagamento demonstrativo.',
      );
      router.push('/pedidos');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Erro ao registrar pedido.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-900 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Minha Sacola
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-0.5">
              Sacola &amp; Checkout Demonstrativo
            </h1>
          </div>
          <Link
            href="/#catalogo"
            className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
          >
            Continuar comprando →
          </Link>
        </div>

        {/* Academic Demonstrative Payment Notice */}
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 flex items-start gap-3.5">
          <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <Info size={17} />
          </div>
          <div className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900 font-bold block mb-0.5">
              Aviso de Pagamento Demonstrativo (Sem Cobrança Real)
            </strong>
            A forma de pagamento escolhida (<strong>PIX</strong> ou <strong>Cartão</strong>) é registrada
            exclusivamente para fins de demonstração acadêmica. Nenhuma cobrança financeira real é realizada.
            O pedido inicia como <strong>PENDENTE</strong> com reserva imediata no estoque e avança para <strong>CONFIRMADO</strong> após validação por um Atendente ou Administrador.
            Pedidos sem confirmação em até <strong>30 minutos</strong> expiram automaticamente devolvendo o estoque.
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={24} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">Sua sacola está vazia</h2>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              Adicione águas minerais, sucos integrais, refrigerantes ou chás do nosso catálogo.
            </p>
            <Link
              href="/#catalogo"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs"
            >
              <span>Explorar Catálogo</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Items, Address & Payment */}
            <div className="lg:col-span-8 space-y-6">
              {/* 1. Cart Items */}
              <section className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <h2 className="text-lg font-bold text-slate-900">
                    1. Itens na Sacola ({items.length})
                  </h2>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Esvaziar sacola
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                    >
                      <div className="h-20 w-16 rounded-xl border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center overflow-hidden">
                        <ProductArtwork
                          name={item.product.name}
                          brand={item.product.brand}
                          categoryName={item.product.category?.name}
                          volumeMl={item.product.volume_ml}
                          imageUrl={item.product.image_url}
                          size="sm"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                          {item.product.brand} • {item.product.volume_ml}ml
                        </span>
                        <Link href={`/produto/${item.product.id}`}>
                          <h3 className="font-bold text-base text-slate-900 hover:text-teal-700 transition-colors truncate">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Unitário: R$ {parseFloat(item.product.price).toFixed(2).replace('.', ',')} • Estoque: {item.product.stock_quantity} un.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <div className="text-right min-w-[80px]">
                          <span className="text-sm font-extrabold text-slate-900">
                            R${' '}
                            {(parseFloat(item.product.price) * item.quantity)
                              .toFixed(2)
                              .replace('.', ',')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. Delivery Address */}
              {isAuthenticated && user?.role === 'CLIENTE' && (
                <section className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MapPin size={18} className="text-teal-700" />
                      <span>2. Endereço de Entrega</span>
                    </h2>
                    <Link
                      href="/perfil?tab=ENDERECOS"
                      className="text-xs font-bold text-teal-700 hover:underline"
                    >
                      Gerenciar Endereços →
                    </Link>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center space-y-2.5">
                      <p className="text-xs text-slate-500">
                        Você ainda não possui um endereço de entrega cadastrado.
                      </p>
                      <Link
                        href="/perfil?tab=ENDERECOS"
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-700 text-white font-bold text-xs uppercase tracking-wider"
                      >
                        Cadastrar Endereço Agora
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {addresses.map((addr) => {
                        const selected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              selected
                                ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-600'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                                {addr.is_default ? 'Endereço Padrão' : 'Endereço Alternativo'}
                              </span>
                              {selected && <CheckCircle2 size={16} className="text-teal-700" />}
                            </div>
                            <p className="font-bold text-xs text-slate-900">
                              {addr.street}, {addr.number}
                            </p>
                            {addr.complement && (
                              <p className="text-[11px] text-slate-500">{addr.complement}</p>
                            )}
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {addr.neighborhood} — {addr.city}/{addr.state}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                              CEP {addr.zip}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* 3. Demonstrative Payment Modality */}
              {isAuthenticated && user?.role === 'CLIENTE' && (
                <section className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3.5">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard size={18} className="text-teal-700" />
                      <span>3. Forma de Pagamento Demonstrativa</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Selecione o método demonstrativo que constará no seu pedido.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentMethod === 'PIX'
                          ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-900">
                          PIX (Demonstrativo)
                        </span>
                        {paymentMethod === 'PIX' && (
                          <CheckCircle2 size={16} className="text-teal-700" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Registra pagamento via PIX sem geração de cobrança financeira real.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARTAO')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentMethod === 'CARTAO'
                          ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-900">
                          Cartão (Demonstrativo)
                        </span>
                        {paymentMethod === 'CARTAO' && (
                          <CheckCircle2 size={16} className="text-teal-700" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Registra Cartão de Crédito. Nenhum dado de cartão é coletado ou cobrado.
                      </p>
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Server Quotation & Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs sticky top-24 space-y-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                    Cotação no Servidor
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    Resumo do Pedido
                  </h2>
                </div>

                {/* Coupon Box */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Cupom de Desconto
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag
                        size={14}
                        className="absolute left-3 top-3 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Ex.: BEMVINDO10"
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-2.5 text-xs font-mono uppercase text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-bold"
                      />
                    </div>
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={() => void removeCoupon()}
                        className="h-10 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void applyCoupon()}
                        className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-teal-700 text-slate-800 hover:text-white border border-slate-200 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Aplicar
                      </button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="text-[11px] text-teal-700 font-semibold mt-1.5">
                      ✓ Cupom {appliedCoupon} aplicado com sucesso!
                    </p>
                  )}
                </div>

                {quoteError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
                    {quoteError}
                  </div>
                )}

                <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Subtotal dos Itens</span>
                    <span className="font-bold text-slate-900">
                      R$ {quoteSubtotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-teal-700 font-semibold">
                      <span>Desconto Aplicado</span>
                      <span className="font-bold">
                        - R$ {discount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Taxa de Entrega</span>
                    <span className="font-bold text-slate-900">
                      {selectedAddressId
                        ? `R$ ${shippingFee.toFixed(2).replace('.', ',')}`
                        : 'Informe o endereço'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Total a Pagar
                    </span>
                    <span className="text-2xl font-extrabold text-teal-800">
                      R$ {quoteTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading || !!quoteError}
                  onClick={() => void handleCheckout()}
                  className="w-full h-12 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <span>
                    {loading
                      ? 'Processando...'
                      : isAuthenticated
                        ? 'Finalizar Pedido Demonstrativo'
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
