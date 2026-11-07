'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  Order,
  Product,
  Category,
  Coupon,
  User,
  SalesReport,
  StockMovement,
  AllowedCategoryName,
} from '@/types';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Package,
  Users,
  CheckCircle,
  Truck,
  Plus,
  Check,
  Tag,
  BarChart3,
  Edit2,
  History,
  AlertTriangle,
  RefreshCw,
  LogOut,
  GlassWater,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

type AdminTab = 'PEDIDOS' | 'CATALOGO' | 'ESTOQUE' | 'CUPONS' | 'EQUIPE' | 'RELATORIOS';

const ALLOWED_CATEGORY_NAMES: AllowedCategoryName[] = ['Água', 'Sucos', 'Refrigerantes', 'Chás'];

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>('PEDIDOS');
  const [loading, setLoading] = useState(true);

  // Pedidos & Entregas (UC08 / UC11)
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliverers, setDeliverers] = useState<{ id: number; name: string }[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderFromFilter, setOrderFromFilter] = useState('');
  const [orderToFilter, setOrderToFilter] = useState('');
  const [paymentReferences, setPaymentReferences] = useState<Record<number, string>>({});

  // Catálogo & Categorias (UC09)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    brand: '',
    category_id: '',
    price: '',
    volume_ml: '350',
    stock_quantity: '20',
    description: '',
    image_url: '',
  });
  const [catForm, setCatForm] = useState<{
    id?: number;
    name: AllowedCategoryName;
    description: string;
    active: boolean;
  }>({
    name: 'Água',
    description: '',
    active: true,
  });

  // Estoque (UC10)
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [stockMoveForm, setStockMoveForm] = useState<{
    type: 'ENTRADA' | 'SAIDA';
    quantity: string;
    reason: string;
  }>({
    type: 'ENTRADA',
    quantity: '10',
    reason: '',
  });
  const [stockHistoryList, setStockHistoryList] = useState<StockMovement[]>([]);

  // Cupons (UC06 / Admin)
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponForm, setCouponForm] = useState<{
    id?: number;
    code: string;
    discount_type: 'PERCENTUAL' | 'FIXO';
    discount_value: string;
    valid_from: string;
    valid_until: string;
    active: boolean;
  }>({
    code: '',
    discount_type: 'PERCENTUAL',
    discount_value: '10',
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: '2026-12-31',
    active: true,
  });

  // Equipe (Seção 3.1 / Admin)
  const [staffList, setStaffList] = useState<User[]>([]);
  const [staffForm, setStaffForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: 'ATENDENTE' | 'ENTREGADOR' | 'ADMINISTRADOR';
  }>({
    name: '',
    email: '',
    password: '',
    role: 'ATENDENTE',
  });

  // Relatórios (UC12)
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstOfYear = `${todayStr.slice(0, 4)}-01-01`;
  const [reportFrom, setReportFrom] = useState(firstOfYear);
  const [reportTo, setReportTo] = useState(todayStr);
  const [reportGroupBy, setReportGroupBy] = useState<'PRODUTO' | 'CATEGORIA' | 'PAGAMENTO'>(
    'CATEGORIA',
  );
  const [reportData, setReportData] = useState<SalesReport | null>(null);

  // --- RELATÓRIOS DE VENDAS (UC12 / RF16) ---
  const runReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const res = await api.get<SalesReport>(
        `/reports/sales?from=${reportFrom}&to=${reportTo}&group_by=${reportGroupBy}`,
      );
      setReportData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar relatório.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (activeTab === 'PEDIDOS' || user.role === 'ATENDENTE') {
        const params = new URLSearchParams({ limit: '50' });
        if (orderStatusFilter) params.set('status', orderStatusFilter);
        if (orderFromFilter) params.set('from', orderFromFilter);
        if (orderToFilter) params.set('to', orderToFilter);

        const [oRes, dRes] = await Promise.all([
          api.getPaginated<Order[]>(`/orders?${params.toString()}`),
          api.get<{ id: number; name: string }[]>('/staff/deliverers'),
        ]);
        setOrders(oRes.data || []);
        setDeliverers(dRes || []);
      } else if (activeTab === 'CATALOGO' && user.role === 'ADMINISTRADOR') {
        const [pRes, cRes] = await Promise.all([
          api.getPaginated<Product[]>('/admin/products?limit=100'),
          api.getPaginated<Category[]>('/admin/categories?limit=50&include_inactive=true'),
        ]);
        setProducts(pRes.data || []);
        setCategories(cRes.data || []);
        if (!prodForm.category_id && cRes.data?.length) {
          const activeCat = cRes.data.find((c) => c.active);
          if (activeCat) {
            setProdForm((prev) => ({ ...prev, category_id: String(activeCat.id) }));
          }
        }
      } else if (activeTab === 'ESTOQUE' && user.role === 'ADMINISTRADOR') {
        const pRes = await api.getPaginated<Product[]>('/admin/products?limit=100');
        const list = pRes.data || [];
        setProducts(list);
        if (list.length > 0) {
          try {
            const hist = await api.getPaginated<StockMovement[]>(`/products/${list[0].id}/stock?limit=20`);
            setStockHistoryList(hist.data || []);
          } catch {
            // ignore
          }
        }
      } else if (activeTab === 'CUPONS' && user.role === 'ADMINISTRADOR') {
        const cRes = await api.getPaginated<Coupon[]>('/coupons?limit=50');
        setCoupons(cRes.data || []);
      } else if (activeTab === 'EQUIPE' && user.role === 'ADMINISTRADOR') {
        const sRes = await api.getPaginated<User[]>('/staff?limit=50');
        setStaffList(sRes.data || []);
      } else if (activeTab === 'RELATORIOS' && user.role === 'ADMINISTRADOR') {
        await runReport();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar dados.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickSwitchAccount = async (email: string, targetTab?: AdminTab) => {
    try {
      setLoading(true);
      const res = await api.post<{ token: string; user: User }>('/auth/login', {
        email,
        password: 'Admin@123',
      });
      login(res.token, res.user);
      if (targetTab) setActiveTab(targetTab);
      toast.success(`Conectado como ${res.user.name} (${res.user.role})`);
    } catch {
      toast.error('Erro ao alternar conta demonstrativa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && (user.role === 'ADMINISTRADOR' || user.role === 'ATENDENTE')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, user, activeTab, router]);

  // --- OPERAÇÃO DE PEDIDOS (UC08 / UC11 / RN08 / RN12) ---
  const changeOrderStatus = async (id: number, status: string) => {
    let reason: string | undefined;
    if (status === 'CANCELADO') {
      const input = prompt('Informe o motivo do cancelamento:', 'Cancelado pela operação');
      if (!input || !input.trim()) return;
      reason = input.trim();
    }
    try {
      await api.patch(`/orders/${id}/status`, { status, ...(reason ? { reason } : {}) });
      toast.success(`Status do pedido #${id} atualizado para ${status}!`);
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar pedido.';
      toast.error(msg);
    }
  };

  const confirmPayment = async (orderId: number, status: 'PAGO' | 'ESTORNADO' = 'PAGO') => {
    const refInput =
      paymentReferences[orderId]?.trim() ||
      (status === 'PAGO'
        ? `Confirmação manual demonstrativa #${orderId}`
        : `Estorno demonstrativo #${orderId}`);

    try {
      await api.patch(`/orders/${orderId}/payment`, {
        status,
        reference: refInput,
      });
      toast.success(
        status === 'PAGO'
          ? `Pagamento demonstrativo do pedido #${orderId} confirmado como PAGO!`
          : `Estorno do pedido #${orderId} registrado!`,
      );
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao registrar pagamento.';
      toast.error(msg);
    }
  };

  const assignDeliverer = async (deliveryId: number, delivererId: number) => {
    if (!delivererId) return;
    try {
      await api.patch(`/deliveries/${deliveryId}/assign`, { deliverer_id: Number(delivererId) });
      toast.success('Entregador atribuído à entrega!');
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao atribuir entregador.';
      toast.error(msg);
    }
  };

  // --- GESTÃO DE CATÁLOGO E CATEGORIAS (UC09 / RF13 / RN11 / RN13) ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: catForm.name,
        description: catForm.description.trim() || null,
        active: catForm.active,
      };
      if (catForm.id) {
        await api.put(`/categories/${catForm.id}`, payload);
        toast.success('Categoria atualizada!');
      } else {
        await api.post('/categories', payload);
        toast.success('Categoria criada!');
      }
      setCatForm({ name: 'Água', description: '', active: true });
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar categoria.';
      toast.error(msg);
    }
  };

  const handleToggleCategoryActive = async (cat: Category) => {
    try {
      await api.put(`/categories/${cat.id}`, {
        name: cat.name,
        description: cat.description || null,
        active: !cat.active,
      });
      toast.success(cat.active ? 'Categoria inativada.' : 'Categoria ativada.');
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao alterar status da categoria.';
      toast.error(msg);
    }
  };

  const openEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdForm({
      name: p.name,
      brand: p.brand,
      category_id: String(p.category?.id || p.category_id || ''),
      price: String(p.price),
      volume_ml: String(p.volume_ml),
      stock_quantity: String(p.stock_quantity),
      description: p.description || '',
      image_url: p.image_url || '',
    });
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const basePayload: Record<string, unknown> = {
        name: prodForm.name.trim(),
        brand: prodForm.brand.trim(),
        category_id: Number(prodForm.category_id),
        price: Number(prodForm.price),
        volume_ml: Number(prodForm.volume_ml),
        abv_percent: 0,
        description: prodForm.description.trim() || null,
        image_url: prodForm.image_url.trim() || null,
      };

      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, basePayload);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await api.post('/products', {
          ...basePayload,
          stock_quantity: Number(prodForm.stock_quantity),
        });
        toast.success('Produto não alcoólico cadastrado com sucesso!');
      }

      setShowProductForm(false);
      setEditingProductId(null);
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar produto.';
      toast.error(msg);
    }
  };

  const handleToggleProductActive = async (p: Product) => {
    try {
      if (p.active) {
        await api.delete(`/products/${p.id}`);
        toast.success('Produto inativado e ocultado do catálogo público.');
      } else {
        await api.put(`/products/${p.id}`, { active: true });
        toast.success('Produto reativado no catálogo!');
      }
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao alterar disponibilidade do produto.';
      toast.error(msg);
    }
  };

  // --- GESTÃO DE ESTOQUE (UC10 / RF14) ---
  const openStockModal = async (p: Product) => {
    setStockModalProduct(p);
    setStockMoveForm({ type: 'ENTRADA', quantity: '10', reason: '' });
    try {
      const hist = await api.getPaginated<StockMovement[]>(`/products/${p.id}/stock?limit=20`);
      setStockHistoryList(hist.data || []);
    } catch {
      setStockHistoryList([]);
    }
  };

  const handleMoveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalProduct) return;
    try {
      await api.post(`/products/${stockModalProduct.id}/stock`, {
        type: stockMoveForm.type,
        quantity: Number(stockMoveForm.quantity),
        reason: stockMoveForm.reason.trim(),
      });
      toast.success('Movimentação de estoque registrada!');
      setStockModalProduct(null);
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao movimentar estoque.';
      toast.error(msg);
    }
  };

  // --- GESTÃO DE CUPONS (UC06 / Admin) ---
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value),
        valid_from: couponForm.valid_from,
        valid_until: couponForm.valid_until,
        active: couponForm.active,
      };
      if (couponForm.id) {
        await api.put(`/coupons/${couponForm.id}`, payload);
        toast.success('Cupom atualizado!');
      } else {
        await api.post('/coupons', payload);
        toast.success('Cupom criado!');
      }
      setCouponForm({
        code: '',
        discount_type: 'PERCENTUAL',
        discount_value: '10',
        valid_from: new Date().toISOString().slice(0, 10),
        valid_until: '2026-12-31',
        active: true,
      });
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar cupom.';
      toast.error(msg);
    }
  };

  // --- GESTÃO DE EQUIPE (Seção 3.1) ---
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/staff', {
        name: staffForm.name.trim(),
        email: staffForm.email.trim().toLowerCase(),
        password: staffForm.password,
        role: staffForm.role,
      });
      toast.success(`Membro da equipe (${staffForm.role}) cadastrado!`);
      setStaffForm({ name: '', email: '', password: '', role: 'ATENDENTE' });
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao cadastrar membro da equipe.';
      toast.error(msg);
    }
  };

  const handleToggleUserActive = async (u: User) => {
    try {
      await api.patch(`/users/${u.id}/active`, { active: !u.active });
      toast.success(u.active ? 'Conta desativada.' : 'Conta ativada.');
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao alterar status da conta.';
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0c0a] text-[#c9a256] flex items-center justify-center font-serif text-2xl">
        Carregando Painel...
      </div>
    );
  }

  if (!user || (user.role !== 'ADMINISTRADOR' && user.role !== 'ATENDENTE')) {
    return (
      <div className="min-h-screen bg-[#0e0c0a] text-[#f4efe6] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-[#c9a256]/30 bg-[#14110e] p-8 text-center space-y-6 shadow-2xl">
          <div className="h-14 w-14 rounded-full border border-[#c9a256]/40 bg-[#1c1712] flex items-center justify-center mx-auto text-[#c9a256]">
            <Shield size={24} />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-semibold text-[#f4efe6]">
              Acesso ao Painel Administrativo
            </h1>
            <p className="text-xs text-[#9e9589] leading-relaxed">
              {user
                ? `Você está conectado como ${user.name} (${user.role}). Escolha abaixo com qual perfil operacional deseja abrir o painel:`
                : 'Selecione o perfil demonstrativo para abrir o painel imediatamente:'}
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void quickSwitchAccount('admin@adegaexpress.com', 'PEDIDOS')}
              className="w-full h-12 rounded-full bg-[#c9a256] hover:bg-[#d8b467] text-[#0e0c0a] font-bold text-xs uppercase tracking-[0.16em] cursor-pointer transition-all shadow-lg"
            >
              Entrar como Administrador (T11, T12, T13 e T14)
            </button>
            <button
              type="button"
              onClick={() => void quickSwitchAccount('atendente@adegaexpress.com', 'PEDIDOS')}
              className="w-full h-12 rounded-full border border-[#c9a256]/35 bg-[#1a1511] hover:border-[#c9a256] text-[#f4efe6] font-semibold text-xs uppercase tracking-[0.16em] cursor-pointer transition-all"
            >
              Entrar como Atendente (T09)
            </button>
          </div>
          <Link href="/" className="inline-block text-xs text-[#9e9589] hover:text-[#c9a256]">
            ← Voltar para a vitrine
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'ADMINISTRADOR';
  const filteredStockProducts = lowStockOnly
    ? products.filter((p) => p.stock_quantity <= lowStockThreshold)
    : products;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row font-sans text-white">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-black border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-amber-500 bg-zinc-900 flex items-center justify-center text-amber-500 shrink-0">
            <GlassWater size={18} />
          </div>
          <div>
            <span className="font-black text-base tracking-tighter block leading-none">
              ADEGA<span className="text-amber-500">EXPRESS</span>
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              Painel {isAdmin ? 'Administrador' : 'Atendente'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 flex md:flex-col gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('PEDIDOS')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap ${
              activeTab === 'PEDIDOS'
                ? 'bg-amber-600 text-black'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-amber-500'
            }`}
          >
            <ShoppingBag size={16} /> Pedidos & Pagamentos
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('CATALOGO')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap ${
                  activeTab === 'CATALOGO'
                    ? 'bg-amber-600 text-black'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-amber-500'
                }`}
              >
                <Package size={16} /> Catálogo & Categorias
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ESTOQUE')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap ${
                  activeTab === 'ESTOQUE'
                    ? 'bg-amber-600 text-black'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-amber-500'
                }`}
              >
                <History size={16} /> Gestão de Estoque
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CUPONS')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap ${
                  activeTab === 'CUPONS'
                    ? 'bg-amber-600 text-black'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-amber-500'
                }`}
              >
                <Tag size={16} /> Cupons de Desconto
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('EQUIPE')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap ${
                  activeTab === 'EQUIPE'
                    ? 'bg-amber-600 text-black'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-amber-500'
                }`}
              >
                <Users size={16} /> Equipe & Perfis
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('RELATORIOS')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap ${
                  activeTab === 'RELATORIOS'
                    ? 'bg-amber-600 text-black'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-amber-500'
                }`}
              >
                <BarChart3 size={16} /> Relatórios de Vendas
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-800 hidden md:block">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-black flex items-center justify-center font-black text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-amber-500 uppercase font-bold">{user.role}</p>
            </div>
          </div>
          <div className="space-y-2">
            {!isAdmin ? (
              <button
                type="button"
                onClick={() => void quickSwitchAccount('admin@adegaexpress.com', 'PEDIDOS')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-black rounded text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Shield size={14} /> Alternar p/ Admin (T11-T14)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void quickSwitchAccount('atendente@adegaexpress.com', 'PEDIDOS')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 border border-amber-500/40 text-amber-400 hover:bg-zinc-800 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Alternar p/ Atendente (T09)
              </button>
            )}
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded text-xs font-bold transition-colors"
            >
              Voltar para a Loja
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/50 rounded text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut size={14} /> Sair da Conta
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950">
          <h1 className="text-base md:text-lg font-black uppercase tracking-wider text-white">
            {activeTab === 'PEDIDOS' && 'Mesa de Operações — Pedidos, Pagamentos & Entregas (UC08 / UC11)'}
            {activeTab === 'CATALOGO' && 'Gerenciar Catálogo Não Alcoólico & Categorias (UC09)'}
            {activeTab === 'ESTOQUE' && 'Controle & Movimentação Manual de Estoque (UC10)'}
            {activeTab === 'CUPONS' && 'Gestão de Cupons de Desconto (UC06)'}
            {activeTab === 'EQUIPE' && 'Gestão de Equipe Interna (Atendentes, Entregadores e Admins)'}
            {activeTab === 'RELATORIOS' && 'Relatórios de Vendas Demonstrativas (UC12)'}
          </h1>
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <button
                type="button"
                onClick={() => void quickSwitchAccount('admin@adegaexpress.com', 'PEDIDOS')}
                className="inline-flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-black px-3.5 py-2 rounded font-black uppercase tracking-wider cursor-pointer"
              >
                <Shield size={14} /> Mudar para Admin (Ver T11, T12, T13, T14)
              </button>
            )}
            <button
              type="button"
              onClick={() => void fetchData()}
              className="inline-flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-700 px-3.5 py-2 rounded hover:bg-zinc-800 font-bold uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ABA 1: PEDIDOS (UC08 / UC11) */}
          {activeTab === 'PEDIDOS' && (
            <div className="space-y-6">
              {/* Filtros de Pedido (UC11) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                    Filtrar por Status
                  </label>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                  >
                    <option value="">Todos os Status</option>
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="CONFIRMADO">CONFIRMADO</option>
                    <option value="SEPARADO">SEPARADO</option>
                    <option value="EM_ROTA">EM_ROTA</option>
                    <option value="ENTREGUE">ENTREGUE</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={orderFromFilter}
                    onChange={(e) => setOrderFromFilter(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={orderToFilter}
                    onChange={(e) => setOrderToFilter(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void fetchData()}
                  className="bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest text-xs px-4 py-2 rounded"
                >
                  Filtrar Pedidos
                </button>
              </div>

              {loading ? (
                <div className="text-center py-16 text-amber-500 font-black uppercase tracking-widest animate-pulse text-xs">
                  Carregando pedidos...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 bg-zinc-900 rounded-xl border border-zinc-800 text-sm">
                  Nenhum pedido encontrado para os filtros informados.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className={`bg-zinc-900 border rounded-xl p-5 flex flex-col lg:flex-row gap-6 shadow-lg ${
                        order.status === 'PENDENTE' ? 'border-amber-500/70' : 'border-zinc-800'
                      }`}
                    >
                      {/* Detalhes do Pedido */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-base font-black text-white">Pedido #{order.id}</h2>
                          <span className="bg-zinc-800 text-amber-400 text-[10px] font-black uppercase px-2.5 py-1 rounded">
                            Status: {order.status}
                          </span>
                          {order.payment_status === 'PAGO' ? (
                            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase px-2.5 py-1 rounded flex items-center gap-1">
                              <Check size={12} /> PAGAMENTO DEMONSTRATIVO: PAGO
                            </span>
                          ) : (
                            <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase px-2.5 py-1 rounded">
                              PAGAMENTO: {order.payment_status}
                            </span>
                          )}
                          <span className="text-xs text-zinc-400">
                            {new Date(order.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-300">
                          Cliente: <strong className="text-white">{order.user?.name}</strong> (
                          {order.user?.email}) • Modalidade:{' '}
                          <strong className="text-amber-400">{order.payment_method}</strong>
                        </p>

                        {order.address_snapshot && (
                          <p className="text-xs text-zinc-400">
                            Entrega: {order.address_snapshot.street}, {order.address_snapshot.number}{' '}
                            — {order.address_snapshot.neighborhood}, {order.address_snapshot.city}/
                            {order.address_snapshot.state}
                          </p>
                        )}

                        {order.paid_at && (
                          <p className="text-[11px] text-emerald-400">
                            Confirmado em: {new Date(order.paid_at).toLocaleString('pt-BR')}
                            {order.payments && order.payments.length > 0 && (
                              <>
                                {' '}
                                • Ref: &quot;{order.payments[order.payments.length - 1].reference}&quot; (Ator #
                                {order.payments[order.payments.length - 1].actor_id})
                              </>
                            )}
                          </p>
                        )}

                        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 mt-2">
                          <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">
                            Itens do Pedido
                          </p>
                          {order.items?.map((item) => (
                            <div
                              key={item.id}
                              className="text-xs text-zinc-300 flex justify-between py-0.5"
                            >
                              <span>
                                {item.quantity}x {item.product_name}
                              </span>
                              <span>
                                R$ {Number(item.unit_price).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ))}
                          <div className="mt-2 pt-2 border-t border-zinc-800 flex justify-between font-bold text-amber-500 text-xs">
                            <span>TOTAL DO PEDIDO</span>
                            <span>R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações Operacionais (UC08 / UC11 / RN08 / RN12) */}
                      <div className="w-full lg:w-80 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-zinc-800 pt-4 lg:pt-0 lg:pl-6">
                        {/* Confirmação Manual de Pagamento Demonstrativo (RN12 / RF22) */}
                        {order.payment_status === 'PENDENTE' && order.status !== 'CANCELADO' && (
                          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2">
                            <label className="block text-[10px] font-black uppercase text-amber-400">
                              1. Confirmar Pagamento Demonstrativo (RN12)
                            </label>
                            <input
                              type="text"
                              value={paymentReferences[order.id] ?? ''}
                              onChange={(e) =>
                                setPaymentReferences((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              placeholder="Referência demonstrativa (ex.: Conferido no caixa)"
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => void confirmPayment(order.id, 'PAGO')}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs py-2.5 rounded transition-colors flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle size={15} /> Registrar Pagamento PAGO
                            </button>
                          </div>
                        )}

                        {order.payment_status === 'ESTORNO_PENDENTE' && (
                          <button
                            type="button"
                            onClick={() => void confirmPayment(order.id, 'ESTORNADO')}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black uppercase text-xs py-2.5 rounded transition-colors"
                          >
                            Registrar Estorno Demonstrativo
                          </button>
                        )}

                        {/* Avançar Status do Pedido (RN08: exige PAGO antes de CONFIRMADO) */}
                        {order.status === 'PENDENTE' && (
                          <button
                            type="button"
                            disabled={order.payment_status !== 'PAGO'}
                            onClick={() => void changeOrderStatus(order.id, 'CONFIRMADO')}
                            title={
                              order.payment_status !== 'PAGO'
                                ? 'Confirme o pagamento demonstrativo antes de confirmar o pedido (RN08)'
                                : ''
                            }
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black uppercase text-xs py-2.5 rounded transition-colors"
                          >
                            {order.payment_status === 'PAGO'
                              ? '2. Avançar para CONFIRMADO'
                              : 'Aguardando PAGO para Confirmar (RN08)'}
                          </button>
                        )}

                        {order.status === 'CONFIRMADO' && (
                          <button
                            type="button"
                            onClick={() => void changeOrderStatus(order.id, 'SEPARADO')}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black uppercase text-xs py-2.5 rounded transition-colors"
                          >
                            Marcar como SEPARADO (Gera Entrega)
                          </button>
                        )}

                        {/* Atribuição de Entregador (UC08 A01 / UC11 A01) */}
                        {order.status === 'SEPARADO' && order.delivery && (
                          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                            <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1.5 flex items-center gap-1">
                              <Truck size={12} className="text-amber-500" /> Atribuir Entregador
                              (Status: {order.delivery.status}):
                            </label>
                            <select
                              onChange={(e) =>
                                void assignDeliverer(order.delivery!.id, Number(e.target.value))
                              }
                              value={order.delivery.deliverer_id || ''}
                              className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs p-2 rounded focus:border-amber-500"
                            >
                              <option value="">-- Selecionar Entregador --</option>
                              {deliverers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {['PENDENTE', 'CONFIRMADO', 'SEPARADO'].includes(order.status) && (
                          <button
                            type="button"
                            onClick={() => void changeOrderStatus(order.id, 'CANCELADO')}
                            className="w-full text-red-400 hover:text-red-300 font-bold uppercase text-[11px] py-1"
                          >
                            Cancelar Pedido (Devolve Estoque)
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 2: CATÁLOGO E CATEGORIAS (UC09 / RF13) */}
          {activeTab === 'CATALOGO' && isAdmin && (
            <div className="space-y-8">
              {/* Gestão de Categorias Permitidas */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-amber-500 mb-4">
                  Categorias do Escopo Não Alcoólico (Água, Sucos, Refrigerantes e Chás)
                </h2>

                <form
                  onSubmit={handleSaveCategory}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 bg-zinc-950 p-4 rounded-lg border border-zinc-800"
                >
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                      Categoria Permitida
                    </label>
                    <select
                      value={catForm.name}
                      onChange={(e) =>
                        setCatForm({ ...catForm, name: e.target.value as AllowedCategoryName })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                    >
                      {ALLOWED_CATEGORY_NAMES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={catForm.description}
                      onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                      placeholder="Descrição da categoria..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase text-xs py-2 px-3 rounded"
                    >
                      {catForm.id ? 'Atualizar' : 'Salvar Categoria'}
                    </button>
                    {catForm.id && (
                      <button
                        type="button"
                        onClick={() =>
                          setCatForm({ name: 'Água', description: '', active: true })
                        }
                        className="bg-zinc-800 text-xs px-3 py-2 rounded"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-black text-sm text-white">{c.name}</span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              c.active
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {c.active ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2">
                          {c.description || 'Sem descrição'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-900">
                        {ALLOWED_CATEGORY_NAMES.includes(c.name as AllowedCategoryName) && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setCatForm({
                                  id: c.id,
                                  name: c.name as AllowedCategoryName,
                                  description: c.description || '',
                                  active: c.active ?? true,
                                })
                              }
                              className="text-[10px] font-bold text-amber-500 hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleCategoryActive(c)}
                              className="text-[10px] font-bold text-zinc-400 hover:text-white ml-auto"
                            >
                              {c.active ? 'Inativar' : 'Ativar'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gestão de Produtos */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider text-white">
                      Produtos Cadastrados ({products.length})
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Cadastre, edite ou inative produtos não alcoólicos preservando o histórico de pedidos.
                    </p>
                  </div>
                  {!showProductForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProductId(null);
                        setProdForm({
                          name: '',
                          brand: '',
                          category_id: String(
                            categories.find((c) => c.active)?.id || categories[0]?.id || '',
                          ),
                          price: '',
                          volume_ml: '350',
                          stock_quantity: '20',
                          description: '',
                          image_url: '',
                        });
                        setShowProductForm(true);
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest text-xs px-4 py-2.5 rounded flex items-center gap-1.5"
                    >
                      <Plus size={15} /> Novo Produto
                    </button>
                  )}
                </div>

                {showProductForm && (
                  <form
                    onSubmit={handleSaveProduct}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 mb-6 space-y-4"
                  >
                    <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">
                      {editingProductId ? 'Editar Produto' : 'Cadastrar Novo Produto Não Alcoólico'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                          Nome do Produto
                        </label>
                        <input
                          type="text"
                          required
                          value={prodForm.name}
                          onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                          placeholder="Ex.: Água Mineral Sem Gás 500ml"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                          Marca
                        </label>
                        <input
                          type="text"
                          required
                          value={prodForm.brand}
                          onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                          placeholder="Ex.: Minalba"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                          Categoria
                        </label>
                        <select
                          required
                          value={prodForm.category_id}
                          onChange={(e) =>
                            setProdForm({ ...prodForm, category_id: e.target.value })
                          }
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                        >
                          {categories
                            .filter((c) => c.active)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                          Preço (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={prodForm.price}
                          onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                          Volume da Embalagem (ml)
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={prodForm.volume_ml}
                          onChange={(e) => setProdForm({ ...prodForm, volume_ml: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                        />
                      </div>
                      {!editingProductId && (
                        <div>
                          <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                            Quantidade Inicial em Estoque
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={prodForm.stock_quantity}
                            onChange={(e) =>
                              setProdForm({ ...prodForm, stock_quantity: e.target.value })
                            }
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                          />
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                          Descrição (Opcional)
                        </label>
                        <input
                          type="text"
                          value={prodForm.description}
                          onChange={(e) =>
                            setProdForm({ ...prodForm, description: e.target.value })
                          }
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                          URL da Imagem (Opcional)
                        </label>
                        <input
                          type="url"
                          value={prodForm.image_url}
                          onChange={(e) => setProdForm({ ...prodForm, image_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProductForm(false);
                          setEditingProductId(null);
                        }}
                        className="px-4 py-2 rounded border border-zinc-700 text-xs font-bold uppercase"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest text-xs px-6 py-2 rounded"
                      >
                        {editingProductId ? 'Salvar Alterações' : 'Cadastrar Produto'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-400">
                        <th className="p-3">Produto</th>
                        <th className="p-3">Marca</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Volume</th>
                        <th className="p-3">Preço</th>
                        <th className="p-3 text-center">Estoque</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-800/40">
                          <td className="p-3 font-bold text-white">{p.name}</td>
                          <td className="p-3 text-zinc-300">{p.brand}</td>
                          <td className="p-3 text-zinc-400">{p.category?.name}</td>
                          <td className="p-3 text-zinc-400">{p.volume_ml} ml</td>
                          <td className="p-3 text-amber-500 font-bold">
                            R$ {Number(p.price).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="p-3 text-center font-bold text-white">
                            {p.stock_quantity}
                          </td>
                          <td className="p-3 text-center">
                            {p.active ? (
                              <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                Ativo
                              </span>
                            ) : (
                              <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                Inativo
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openEditProduct(p)}
                              className="text-amber-500 hover:underline font-bold inline-flex items-center gap-1"
                            >
                              <Edit2 size={12} /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleProductActive(p)}
                              className="text-zinc-400 hover:text-white underline font-bold"
                            >
                              {p.active ? 'Inativar' : 'Ativar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: GESTÃO DE ESTOQUE (UC10 / RF14) */}
          {activeTab === 'ESTOQUE' && isAdmin && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">
                    Ajuste Manual de Estoque (Reposição, Perdas e Inventário — UC10)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Toda movimentação registra data, responsável e motivo obrigatório.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lowStockOnly}
                      onChange={(e) => setLowStockOnly(e.target.checked)}
                      className="accent-amber-500"
                    />
                    Apenas estoque baixo (≤
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    className="w-16 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white text-center"
                  />
                  <span className="text-xs text-zinc-300">un.)</span>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-400">
                      <th className="p-4">Produto</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4 text-center">Saldo Atual</th>
                      <th className="p-4 text-right">Movimentação / Histórico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredStockProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-800/40">
                        <td className="p-4 font-bold text-white">
                          {p.name}{' '}
                          {!p.active && (
                            <span className="text-[10px] text-red-400 ml-1">(Inativo)</span>
                          )}
                        </td>
                        <td className="p-4 text-zinc-400">{p.category?.name}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`font-black text-sm px-2.5 py-1 rounded ${
                              p.stock_quantity === 0
                                ? 'bg-red-500/20 text-red-400'
                                : p.stock_quantity <= 5
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'text-emerald-400'
                            }`}
                          >
                            {p.stock_quantity} un.
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => void openStockModal(p)}
                            className="bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-wider text-[11px] px-3.5 py-2 rounded"
                          >
                            Ajustar / Ver Histórico
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Histórico Visível de Movimentações com Motivo (T13_admin_estoque) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 mb-3">
                  Movimentações de Estoque Registradas com Motivo (UC10 / RF14)
                </h3>
                {stockHistoryList.length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    Clique em &quot;Ajustar / Ver Histórico&quot; em qualquer produto acima para consultar ou registrar movimentações.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stockHistoryList.map((m) => (
                      <div
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs"
                      >
                        <div>
                          <span
                            className={`font-black uppercase px-2 py-0.5 rounded mr-2 ${
                              m.type === 'ENTRADA'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {m.type} ({m.type === 'ENTRADA' ? '+' : '-'}{m.quantity} un.)
                          </span>
                          <strong className="text-white">Motivo:</strong>{' '}
                          <span className="text-zinc-300">{m.reason}</span>
                        </div>
                        <span className="text-zinc-400 font-mono text-[11px]">
                          {new Date(m.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal de Movimentação de Estoque */}
              {stockModalProduct && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
                    <h3 className="text-base font-black uppercase text-white mb-1">
                      Ajustar Estoque — {stockModalProduct.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4">
                      Saldo atual:{' '}
                      <strong className="text-amber-500">
                        {stockModalProduct.stock_quantity} unidades
                      </strong>
                    </p>

                    <form onSubmit={handleMoveStock} className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                            Tipo de Movimentação
                          </label>
                          <select
                            value={stockMoveForm.type}
                            onChange={(e) =>
                              setStockMoveForm({
                                ...stockMoveForm,
                                type: e.target.value as 'ENTRADA' | 'SAIDA',
                              })
                            }
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                          >
                            <option value="ENTRADA">ENTRADA (Reposição / Inventário)</option>
                            <option value="SAIDA">SAIDA (Perda / Avaria / Ajuste)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                            Quantidade
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={stockMoveForm.quantity}
                            onChange={(e) =>
                              setStockMoveForm({ ...stockMoveForm, quantity: e.target.value })
                            }
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                          Motivo Obrigatório
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={200}
                          value={stockMoveForm.reason}
                          onChange={(e) =>
                            setStockMoveForm({ ...stockMoveForm, reason: e.target.value })
                          }
                          placeholder="Ex.: Reposição de fornecedor / Avaria no transporte"
                          className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setStockModalProduct(null)}
                          className="flex-1 border border-zinc-700 py-2 rounded text-xs font-bold uppercase"
                        >
                          Fechar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase text-xs py-2 rounded"
                        >
                          Registrar Movimentação
                        </button>
                      </div>
                    </form>

                    <div className="border-t border-zinc-800 pt-4 max-h-48 overflow-y-auto">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                        Últimas Movimentações Registradas
                      </p>
                      {stockHistoryList.length === 0 ? (
                        <p className="text-xs text-zinc-500">Nenhuma movimentação encontrada.</p>
                      ) : (
                        <ul className="space-y-1.5 text-xs">
                          {stockHistoryList.map((m) => (
                            <li
                              key={m.id}
                              className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800"
                            >
                              <span>
                                <strong
                                  className={
                                    m.type === 'ENTRADA' ? 'text-emerald-400' : 'text-red-400'
                                  }
                                >
                                  {m.type === 'ENTRADA' ? '+' : '-'}
                                  {m.quantity}
                                </strong>{' '}
                                — {m.reason}
                              </span>
                              <span className="text-zinc-500 text-[10px]">
                                {new Date(m.created_at).toLocaleString('pt-BR')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA 4: CUPONS DE DESCONTO (UC06) */}
          {activeTab === 'CUPONS' && isAdmin && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-amber-500 mb-4">
                  Cadastrar ou Editar Cupom de Desconto
                </h2>
                <form
                  onSubmit={handleSaveCoupon}
                  className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3 bg-zinc-950 p-4 rounded-lg border border-zinc-800"
                >
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                      Código
                    </label>
                    <input
                      type="text"
                      required
                      value={couponForm.code}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                      }
                      placeholder="BEMVINDO10"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                      Tipo
                    </label>
                    <select
                      value={couponForm.discount_type}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          discount_type: e.target.value as 'PERCENTUAL' | 'FIXO',
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                    >
                      <option value="PERCENTUAL">PERCENTUAL (%)</option>
                      <option value="FIXO">FIXO (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                      Valor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={couponForm.discount_value}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, discount_value: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                      Início Vigência
                    </label>
                    <input
                      type="date"
                      required
                      value={couponForm.valid_from}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, valid_from: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                      Fim Vigência
                    </label>
                    <input
                      type="date"
                      required
                      value={couponForm.valid_until}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, valid_until: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black uppercase text-xs py-2 px-3 rounded"
                    >
                      {couponForm.id ? 'Atualizar' : 'Criar Cupom'}
                    </button>
                  </div>
                </form>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-400">
                        <th className="p-3">Código</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Desconto</th>
                        <th className="p-3">Vigência</th>
                        <th className="p-3 text-center">Ativo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {coupons.map((cp) => (
                        <tr key={cp.id}>
                          <td className="p-3 font-black text-amber-500">{cp.code}</td>
                          <td className="p-3 text-zinc-300">{cp.discount_type}</td>
                          <td className="p-3 font-bold text-white">
                            {cp.discount_type === 'PERCENTUAL'
                              ? `${Number(cp.discount_value)}%`
                              : `R$ ${Number(cp.discount_value).toFixed(2).replace('.', ',')}`}
                          </td>
                          <td className="p-3 text-zinc-400">
                            {cp.valid_from.slice(0, 10)} até {cp.valid_until.slice(0, 10)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                cp.active
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-red-500/15 text-red-400'
                              }`}
                            >
                              {cp.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ABA 5: EQUIPE INTERNA (Seção 3.1) */}
          {activeTab === 'EQUIPE' && isAdmin && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-amber-500 mb-4">
                  Cadastrar Membro da Equipe (Atendente, Entregador ou Administrador)
                </h2>
                <form
                  onSubmit={handleCreateStaff}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-zinc-950 p-4 rounded-lg border border-zinc-800"
                >
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                      Senha Inicial (mín. 8)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                      Perfil
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={(e) =>
                        setStaffForm({
                          ...staffForm,
                          role: e.target.value as 'ATENDENTE' | 'ENTREGADOR' | 'ADMINISTRADOR',
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                    >
                      <option value="ATENDENTE">ATENDENTE</option>
                      <option value="ENTREGADOR">ENTREGADOR</option>
                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black uppercase text-xs py-2 px-3 rounded"
                    >
                      Cadastrar Equipe
                    </button>
                  </div>
                </form>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-400">
                        <th className="p-3">Nome</th>
                        <th className="p-3">E-mail</th>
                        <th className="p-3">Perfil</th>
                        <th className="p-3 text-center">Situação</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {staffList.map((st) => (
                        <tr key={st.id}>
                          <td className="p-3 font-bold text-white">{st.name}</td>
                          <td className="p-3 text-zinc-300">{st.email}</td>
                          <td className="p-3">
                            <span className="bg-zinc-800 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                              {st.role}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                st.active
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-red-500/15 text-red-400'
                              }`}
                            >
                              {st.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {st.id !== user.id && (
                              <button
                                type="button"
                                onClick={() => void handleToggleUserActive(st)}
                                className="text-zinc-400 hover:text-white underline font-bold"
                              >
                                {st.active ? 'Desativar' : 'Ativar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ABA 6: RELATÓRIOS DE VENDAS (UC12 / RF16) */}
          {activeTab === 'RELATORIOS' && isAdmin && (
            <div className="space-y-6">
              <form
                onSubmit={runReport}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-wrap items-end gap-4"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    required
                    value={reportFrom}
                    onChange={(e) => setReportFrom(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    required
                    value={reportTo}
                    onChange={(e) => setReportTo(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                    Agrupar por (UC12)
                  </label>
                  <select
                    value={reportGroupBy}
                    onChange={(e) =>
                      setReportGroupBy(
                        e.target.value as 'PRODUTO' | 'CATEGORIA' | 'PAGAMENTO',
                      )
                    }
                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-white"
                  >
                    <option value="CATEGORIA">CATEGORIA</option>
                    <option value="PRODUTO">PRODUTO</option>
                    <option value="PAGAMENTO">FORMA DE PAGAMENTO</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-black font-black uppercase tracking-widest text-xs px-5 py-2.5 rounded"
                >
                  Gerar Relatório
                </button>
              </form>

              {reportData && (
                <div className="space-y-6">
                  {/* KPI Cards (Apenas pedidos PAGO e não cancelados compõem receita — UC12 P03) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                        Receita Demonstrativa (Pedidos PAGOS)
                      </p>
                      <p className="text-2xl font-black text-emerald-400">
                        R$ {Number(reportData.paid_revenue).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Exclui pedidos pendentes e cancelados
                      </p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                        Quantidade de Pedidos Pagos
                      </p>
                      <p className="text-2xl font-black text-white">{reportData.paid_orders}</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                        Ticket Médio
                      </p>
                      <p className="text-2xl font-black text-amber-500">
                        R$ {Number(reportData.average_ticket).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                        Descontos Concedidos
                      </p>
                      <p className="text-2xl font-black text-zinc-200">
                        R$ {Number(reportData.discounts).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>

                  {/* Agrupamento Selecionado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                      <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-4">
                        Produtos Mais Vendidos (Pedidos Pagos)
                      </h3>
                      {reportData.top_products.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                          Nenhuma venda paga registrada no período.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-xs">
                          {reportData.top_products.map((tp) => (
                            <li
                              key={tp.product_id}
                              className="flex justify-between bg-zinc-950 p-2.5 rounded border border-zinc-800"
                            >
                              <span className="font-bold text-white">
                                {tp.name || `Produto #${tp.product_id}`}
                              </span>
                              <span className="text-amber-500 font-black">
                                {tp.quantity} un. vendidas
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                      <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-4">
                        Vendas por Categoria e Forma de Pagamento
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">
                            Por Categoria Não Alcoólica:
                          </p>
                          {reportData.sales_by_category &&
                          reportData.sales_by_category.length > 0 ? (
                            <ul className="space-y-1.5 text-xs">
                              {reportData.sales_by_category.map((sc) => (
                                <li
                                  key={sc.category}
                                  className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800"
                                >
                                  <span>
                                    <strong className="text-white">{sc.category}</strong> (
                                    {sc.quantity} itens)
                                  </span>
                                  <span className="text-emerald-400 font-bold">
                                    R$ {Number(sc.revenue).toFixed(2).replace('.', ',')}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-zinc-500">Sem vendas por categoria.</p>
                          )}
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">
                            Por Modalidade Demonstrativa (PIX / Cartão):
                          </p>
                          {reportData.orders_by_payment_method &&
                          reportData.orders_by_payment_method.length > 0 ? (
                            <ul className="space-y-1.5 text-xs">
                              {reportData.orders_by_payment_method.map((pm) => (
                                <li
                                  key={pm.payment_method}
                                  className="flex justify-between bg-zinc-950 p-2 rounded border border-zinc-800"
                                >
                                  <span>
                                    <strong className="text-white">{pm.payment_method}</strong> (
                                    {pm.count} pedidos)
                                  </span>
                                  <span className="text-amber-500 font-bold">
                                    R$ {Number(pm.total).toFixed(2).replace('.', ',')}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-zinc-500">Sem pagamentos confirmados.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Estoque Baixo */}
                  {reportData.low_stock.length > 0 && (
                    <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-5">
                      <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                        <AlertTriangle size={15} /> Produtos Ativos com Estoque Baixo (≤ 5 un.)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {reportData.low_stock.map((ls) => (
                          <span
                            key={ls.id}
                            className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded text-xs text-zinc-200"
                          >
                            {ls.name}:{' '}
                            <strong className="text-amber-500">{ls.stock_quantity} un.</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
