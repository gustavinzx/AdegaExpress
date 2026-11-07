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
        'Pedido registrado com status PENDENTE! Aguarde a confirmação manual do pagamento demonstrativo.',
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
    <div className="bg-[#0e0c0a] min-h-screen text-[#f4efe6] font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 border-b border-[#c9a256]/15 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#c9a256]">
              Atelier de Compra • UC01
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#f4efe6] mt-1">
              Sacola &amp; Checkout Demonstrativo
            </h1>
          </div>
          <Link
            href="/#catalogo"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c9a256] hover:underline"
          >
            Continuar explorando rótulos →
          </Link>
        </div>

        {/* Academic Demonstrative Payment Notice (RF07 / RNF05) */}
        <div className="mb-10 rounded-2xl border border-[#c9a256]/30 bg-[#161310] p-5 flex items-start gap-4">
          <div className="h-9 w-9 rounded-full bg-[#c9a256]/15 text-[#c9a256] flex items-center justify-center shrink-0 mt-0.5">
            <Info size={18} />
          </div>
          <div className="text-xs text-[#9e9589] leading-relaxed">
            <strong className="text-[#f4efe6] uppercase tracking-wider block mb-1">
              Aviso de Pagamento Demonstrativo (Sem Cobrança Real — RF07 / RNF05)
            </strong>
            A modalidade escolhida (<strong>PIX</strong> ou <strong>Cartão</strong>) é registrada
            exclusivamente para fins acadêmicos demonstrativos. Nenhuma transação bancária ou QR
            Code de cobrança é gerado. O pedido inicia como <strong>PENDENTE</strong> (com reserva
            imediata de estoque — RN01) e avança para <strong>CONFIRMADO</strong> após confirmação
            manual por um Atendente ou Administrador (RN08). Caso não seja confirmado em até{' '}
            <strong>30 minutos</strong>, expira automaticamente devolvendo o estoque (RN07).
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-[#14110e] rounded-3xl border border-[#c9a256]/15 px-6">
            <div className="h-16 w-16 rounded-full bg-[#c9a256]/10 border border-[#c9a256]/25 text-[#c9a256] flex items-center justify-center mx-auto mb-5">
              <ShoppingBag size={26} />
            </div>
            <h2 className="font-serif text-3xl text-[#f4efe6] mb-2">Sua sacola está vazia</h2>
            <p className="text-sm text-[#9e9589] mb-8 max-w-md mx-auto">
              Selecione águas minerais, sucos integrais, refrigerantes ou chás gelados em nossa
              vitrine.
            </p>
            <Link
              href="/#catalogo"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.18em] transition-all"
            >
              <span>Explorar Catálogo</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Items, Address & Demonstrative Payment (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* 1. Cart Items */}
              <section className="bg-[#14110e] p-6 sm:p-8 rounded-3xl border border-[#c9a256]/15 space-y-6">
                <div className="flex items-center justify-between border-b border-[#c9a256]/12 pb-4">
                  <h2 className="font-serif text-2xl font-semibold text-[#f4efe6]">
                    1. Rótulos Selecionados ({items.length})
                  </h2>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-[#9e9589] hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Esvaziar sacola
                  </button>
                </div>

                <div className="divide-y divide-[#c9a256]/10">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center gap-5"
                    >
                      <div className="h-24 w-20 rounded-2xl border border-[#c9a256]/15 bg-[#0e0c0a] shrink-0 flex items-center justify-center overflow-hidden">
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
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a256]">
                          {item.product.brand} • {item.product.volume_ml}mL
                        </span>
                        <Link href={`/produto/${item.product.id}`}>
                          <h3 className="font-serif text-xl font-semibold text-[#f4efe6] hover:text-[#c9a256] transition-colors truncate">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-[#9e9589] mt-0.5 font-mono">
                          Unitário: R$ {parseFloat(item.product.price).toFixed(2).replace('.', ',')}{' '}
                          • Estoque: {item.product.stock_quantity} un.
                        </p>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="inline-flex items-center rounded-full border border-[#c9a256]/25 bg-[#0e0c0a] p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="h-8 w-8 rounded-full flex items-center justify-center text-[#f4efe6] hover:bg-[#1c1814] cursor-pointer"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-9 text-center font-mono text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="h-8 w-8 rounded-full flex items-center justify-center text-[#f4efe6] hover:bg-[#1c1814] cursor-pointer"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <div className="text-right min-w-[90px]">
                          <span className="font-mono text-sm font-bold text-[#f4efe6]">
                            R${' '}
                            {(parseFloat(item.product.price) * item.quantity)
                              .toFixed(2)
                              .replace('.', ',')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="h-9 w-9 rounded-full flex items-center justify-center text-[#9e9589] hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. Delivery Address */}
              {isAuthenticated && user?.role === 'CLIENTE' && (
                <section className="bg-[#14110e] p-6 sm:p-8 rounded-3xl border border-[#c9a256]/15 space-y-5">
                  <div className="flex items-center justify-between border-b border-[#c9a256]/12 pb-4">
                    <h2 className="font-serif text-2xl font-semibold text-[#f4efe6] flex items-center gap-2.5">
                      <MapPin size={20} className="text-[#c9a256]" />
                      <span>2. Endereço de Entrega</span>
                    </h2>
                    <Link
                      href="/perfil?tab=ENDERECOS"
                      className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9a256] hover:underline"
                    >
                      Gerenciar Endereços →
                    </Link>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="rounded-2xl border border-[#c9a256]/20 bg-[#0e0c0a] p-6 text-center space-y-3">
                      <p className="text-sm text-[#9e9589]">
                        Você ainda não possui um endereço de entrega cadastrado.
                      </p>
                      <Link
                        href="/perfil?tab=ENDERECOS"
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#c9a256] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.14em]"
                      >
                        Cadastrar Endereço Agora
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => {
                        const selected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                              selected
                                ? 'border-[#c9a256] bg-[#1c1712] shadow-[0_8px_25px_rgba(201,162,86,0.12)]'
                                : 'border-[#c9a256]/15 bg-[#0e0c0a] hover:border-[#c9a256]/40'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#c9a256]">
                                {addr.is_default ? 'Endereço Padrão' : 'Endereço Cadastrado'}
                              </span>
                              {selected && <CheckCircle2 size={16} className="text-[#c9a256]" />}
                            </div>
                            <p className="font-semibold text-sm text-[#f4efe6]">
                              {addr.street}, {addr.number}
                            </p>
                            {addr.complement && (
                              <p className="text-xs text-[#9e9589]">{addr.complement}</p>
                            )}
                            <p className="text-xs text-[#9e9589] mt-1">
                              {addr.neighborhood} — {addr.city}/{addr.state}
                            </p>
                            <p className="text-[11px] font-mono text-[#9e9589]/70 mt-1">
                              CEP {addr.zip}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* 3. Demonstrative Payment Modality (RF07) */}
              {isAuthenticated && user?.role === 'CLIENTE' && (
                <section className="bg-[#14110e] p-6 sm:p-8 rounded-3xl border border-[#c9a256]/15 space-y-5">
                  <div className="border-b border-[#c9a256]/12 pb-4">
                    <h2 className="font-serif text-2xl font-semibold text-[#f4efe6] flex items-center gap-2.5">
                      <CreditCard size={20} className="text-[#c9a256]" />
                      <span>3. Modalidade de Pagamento Demonstrativa (RF07)</span>
                    </h2>
                    <p className="text-xs text-[#9e9589] mt-1">
                      Escolha a modalidade que ficará registrada no pedido para conferência manual
                      pela equipe.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                        paymentMethod === 'PIX'
                          ? 'border-[#c9a256] bg-[#1c1712] shadow-[0_8px_25px_rgba(201,162,86,0.12)]'
                          : 'border-[#c9a256]/15 bg-[#0e0c0a] hover:border-[#c9a256]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-serif text-xl font-semibold text-[#f4efe6]">
                          PIX (Demonstrativo)
                        </span>
                        {paymentMethod === 'PIX' && (
                          <CheckCircle2 size={17} className="text-[#c9a256]" />
                        )}
                      </div>
                      <p className="text-xs text-[#9e9589] leading-relaxed">
                        Registra PIX como forma de pagamento. Sem QR Code ou cobrança bancária real.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARTAO')}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                        paymentMethod === 'CARTAO'
                          ? 'border-[#c9a256] bg-[#1c1712] shadow-[0_8px_25px_rgba(201,162,86,0.12)]'
                          : 'border-[#c9a256]/15 bg-[#0e0c0a] hover:border-[#c9a256]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-serif text-xl font-semibold text-[#f4efe6]">
                          Cartão (Demonstrativo)
                        </span>
                        {paymentMethod === 'CARTAO' && (
                          <CheckCircle2 size={17} className="text-[#c9a256]" />
                        )}
                      </div>
                      <p className="text-xs text-[#9e9589] leading-relaxed">
                        Registra Cartão no pedido. Nenhum número de cartão é solicitado ou cobrado.
                      </p>
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Server Quotation & Order Summary (4 cols) */}
            <div className="lg:col-span-4">
              <div className="bg-[#14110e] p-6 sm:p-8 rounded-3xl border border-[#c9a256]/25 sticky top-28 space-y-6 shadow-[0_25px_60px_rgba(0,0,0,0.65)]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#c9a256]">
                    Cotação Oficial no Servidor (RF06)
                  </span>
                  <h2 className="font-serif text-2xl font-semibold text-[#f4efe6] mt-1">
                    Resumo do Pedido
                  </h2>
                </div>

                {/* Coupon Box (UC06) */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9e9589] mb-2">
                    Cupom Promocional (UC06)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag
                        size={14}
                        className="absolute left-3.5 top-3.5 text-[#c9a256]/70 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="CÓDIGO"
                        className="w-full h-11 bg-[#0e0c0a] border border-[#c9a256]/20 rounded-xl pl-9 pr-3 text-xs font-mono uppercase text-[#f4efe6] focus:outline-none focus:border-[#c9a256]"
                      />
                    </div>
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={() => void removeCoupon()}
                        className="h-11 px-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void applyCoupon()}
                        className="h-11 px-4 rounded-xl bg-[#1f1a15] hover:bg-[#c9a256] text-[#c9a256] hover:text-[#0e0c0a] border border-[#c9a256]/30 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Aplicar
                      </button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="text-[11px] text-emerald-400 font-mono mt-2">
                      ✓ Cupom {appliedCoupon} validado pelo servidor
                    </p>
                  )}
                </div>

                {quoteError && (
                  <div className="rounded-xl bg-red-950/50 border border-red-500/40 p-3.5 text-xs text-red-200">
                    {quoteError}
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-[#c9a256]/12 text-sm">
                  <div className="flex justify-between text-[#9e9589]">
                    <span>Subtotal dos Itens</span>
                    <span className="font-mono text-[#f4efe6]">
                      R$ {quoteSubtotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Desconto Promocional</span>
                      <span className="font-mono">
                        - R$ {discount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#9e9589]">
                    <span>Taxa de Entrega Fixa</span>
                    <span className="font-mono text-[#f4efe6]">
                      {selectedAddressId
                        ? `R$ ${shippingFee.toFixed(2).replace('.', ',')}`
                        : 'Selecione o endereço'}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-[#c9a256]/15 flex justify-between items-baseline">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c9a256]">
                      Total Demonstrativo
                    </span>
                    <span className="font-mono text-2xl font-bold text-[#f4efe6]">
                      R$ {quoteTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading || !!quoteError}
                  onClick={() => void handleCheckout()}
                  className="w-full h-14 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-semibold text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-[0_10px_30px_rgba(201,162,86,0.28)]"
                >
                  <span>
                    {loading
                      ? 'Processando...'
                      : isAuthenticated
                        ? 'Registrar Pedido Demonstrativo'
                        : 'Entrar para Finalizar'}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
