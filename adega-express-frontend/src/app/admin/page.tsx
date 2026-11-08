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

  const [activeTab, setActiveTab] = useState<AdminTab>('PEDIDOS');
  const [loading, setLoading] = useState(true);

  // Pedidos & Entregas
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliverers, setDeliverers] = useState<{ id: number; name: string }[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderFromFilter, setOrderFromFilter] = useState('');
  const [orderToFilter, setOrderToFilter] = useState('');
  const [paymentReferences, setPaymentReferences] = useState<Record<number, string>>({});

  // Catálogo & Categorias
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

  // Estoque
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

  // Cupons
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

  // Equipe
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

  // Relatórios
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstOfYear = `${todayStr.slice(0, 4)}-01-01`;
  const [reportFrom, setReportFrom] = useState(firstOfYear);
  const [reportTo, setReportTo] = useState(todayStr);
  const [reportGroupBy, setReportGroupBy] = useState<'PRODUTO' | 'CATEGORIA' | 'PAGAMENTO'>('CATEGORIA');
  const [reportData, setReportData] = useState<SalesReport | null>(null);

  const runReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const res = await api.get<SalesReport>(
        `/reports/sales?from=${reportFrom}&to=${reportTo}&group_by=${reportGroupBy}`
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
      if (activeTab === 'PEDIDOS') {
        const params = new URLSearchParams();
        if (orderStatusFilter) params.append('status', orderStatusFilter);
        if (orderFromFilter) params.append('from', orderFromFilter);
        if (orderToFilter) params.append('to', orderToFilter);
        params.append('limit', '50');

        const [oRes, dRes] = await Promise.all([
          api.getPaginated<Order[]>(`/orders?${params.toString()}`),
          api.get<{ id: number; name: string }[]>('/staff/deliverers').catch(() => []),
        ]);
        setOrders(oRes.data || []);
        setDeliverers(dRes || []);
      } else if (activeTab === 'CATALOGO' && user.role === 'ADMINISTRADOR') {
        const [pRes, cRes] = await Promise.all([
          api.getPaginated<Product[]>('/products?limit=100'),
          api.get<Category[]>('/categories'),
        ]);
        setProducts(pRes.data || []);
        setCategories(cRes || []);
      } else if (activeTab === 'ESTOQUE' && user.role === 'ADMINISTRADOR') {
        const pRes = await api.getPaginated<Product[]>('/products?limit=100');
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
    if (user?.role !== 'ADMINISTRADOR') {
      toast.error('Apenas o Administrador pode alternar perfis.');
      return;
    }
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
      void fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, user, activeTab, orderStatusFilter, orderFromFilter, orderToFilter]);

  // Operações de Pedidos
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
          : `Estorno do pedido #${orderId} registrado!`
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

  // Catálogo & Categorias
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
      await api.put(`/categories/${cat.id}`, { active: !cat.active });
      toast.success(cat.active ? 'Categoria inativada.' : 'Categoria ativada!');
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao alterar categoria.';
      toast.error(msg);
    }
  };

  const openEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdForm({
      name: p.name,
      brand: p.brand,
      category_id: String(p.category_id),
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

  // Gestão de Estoque
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

  // Gestão de Cupons
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

  // Gestão de Equipe
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
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center text-sm font-bold">
        Carregando Painel Operacional...
      </div>
    );
  }

  if (!user || (user.role !== 'ADMINISTRADOR' && user.role !== 'ATENDENTE')) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl border border-teal-200 bg-teal-50 flex items-center justify-center mx-auto text-teal-700">
            <Shield size={24} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Acesso ao Painel Operacional
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Área restrita a colaboradores autorizados (Administrador e Atendente).
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full h-11 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all shadow-xs"
            >
              Fazer Login Operacional
            </Link>
            <Link
              href="/"
              className="inline-block text-xs font-bold text-slate-500 hover:text-teal-700"
            >
              ← Voltar para a loja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'ADMINISTRADOR';
  const filteredStockProducts = lowStockOnly
    ? products.filter((p) => p.stock_quantity <= lowStockThreshold)
    : products;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-teal-200 bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
            <GlassWater size={18} />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight block leading-none text-slate-900">
              ADEGA <span className="text-amber-500 font-extrabold">Express</span>
            </span>
            <span className="text-[10px] text-teal-700 uppercase tracking-wider font-bold">
              Painel {isAdmin ? 'Administrador' : 'Atendente'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 flex md:flex-col gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('PEDIDOS')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap cursor-pointer ${
              activeTab === 'PEDIDOS'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShoppingBag size={16} /> Pedidos &amp; Entregas
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('CATALOGO')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap cursor-pointer ${
                  activeTab === 'CATALOGO'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Package size={16} /> Catálogo &amp; Categorias
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ESTOQUE')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap cursor-pointer ${
                  activeTab === 'ESTOQUE'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <History size={16} /> Gestão de Estoque
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CUPONS')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap cursor-pointer ${
                  activeTab === 'CUPONS'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Tag size={16} /> Cupons de Desconto
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('EQUIPE')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap cursor-pointer ${
                  activeTab === 'EQUIPE'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Users size={16} /> Equipe &amp; Perfis
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('RELATORIOS')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold transition-all uppercase tracking-wider text-xs whitespace-nowrap cursor-pointer ${
                  activeTab === 'RELATORIOS'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <BarChart3 size={16} /> Relatórios de Vendas
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200 hidden md:block">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white shadow-xs flex items-center justify-center font-extrabold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-teal-700 uppercase font-bold tracking-wider">{user.role}</p>
            </div>
          </div>
          <div className="space-y-2">
            {/* Somente o ADMIN vê alternar perfil */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => void quickSwitchAccount('atendente@adegaexpress.com', 'PEDIDOS')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Alternar para Atendente
              </button>
            )}
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
            >
              Voltar para a Loja
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut size={14} /> Sair da Conta
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
          <h1 className="text-sm md:text-base font-extrabold tracking-tight text-slate-900">
            {activeTab === 'PEDIDOS' && (isAdmin ? 'Painel do Administrador — Pedidos, Pagamentos & Entregas' : 'Painel do Atendente — Fila de Pedidos & Operações')}
            {activeTab === 'CATALOGO' && 'Gerenciar Catálogo & Categorias Permitidas'}
            {activeTab === 'ESTOQUE' && 'Controle & Movimentação de Estoque Não Alcoólico'}
            {activeTab === 'CUPONS' && 'Gestão de Cupons Promocionais'}
            {activeTab === 'EQUIPE' && 'Gestão de Equipe Interna'}
            {activeTab === 'RELATORIOS' && 'Relatórios de Vendas Demonstrativas'}
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchData()}
              className="inline-flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider cursor-pointer shadow-xs"
            >
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ABA 1: PEDIDOS */}
          {activeTab === 'PEDIDOS' && (
            <div className="space-y-6">
              {/* Filtros de Pedido */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-end gap-4 shadow-xs">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Filtrar por Status
                  </label>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-teal-600"
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={orderFromFilter}
                    onChange={(e) => setOrderFromFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={orderToFilter}
                    onChange={(e) => setOrderToFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void fetchData()}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
                >
                  Filtrar Pedidos
                </button>
              </div>

              {loading ? (
                <div className="text-center py-16 text-slate-500 font-bold uppercase tracking-wider animate-pulse text-xs">
                  Carregando pedidos...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200 text-sm">
                  Nenhum pedido encontrado para os filtros informados.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row gap-6 shadow-xs hover:border-slate-300 transition-all"
                    >
                      {/* Detalhes do Pedido */}
                      <div className="flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-extrabold text-slate-900">Pedido #{order.id}</h2>
                          
                          {/* Badge de Status */}
                          <span
                            className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg border ${
                              order.status === 'PENDENTE'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : order.status === 'CONFIRMADO'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : order.status === 'SEPARADO'
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : order.status === 'EM_ROTA'
                                      ? 'bg-teal-50 text-teal-800 border-teal-200'
                                      : order.status === 'ENTREGUE'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            Status: {order.status}
                          </span>

                          {/* Badge de Pagamento */}
                          {order.payment_status === 'PAGO' ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Check size={12} /> Pagamento: PAGO
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase px-2.5 py-1 rounded-lg">
                              Pagamento: {order.payment_status}
                            </span>
                          )}

                          <span className="text-xs text-slate-500">
                            {new Date(order.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600">
                          Cliente: <strong className="text-slate-900 font-bold">{order.user?.name}</strong> ({order.user?.email}) • Forma:{' '}
                          <strong className="text-teal-700 font-bold">{order.payment_method}</strong>
                        </p>

                        {order.address_snapshot && (
                          <p className="text-xs text-slate-500">
                            Entrega: {order.address_snapshot.street}, {order.address_snapshot.number} — {order.address_snapshot.neighborhood}, {order.address_snapshot.city}/{order.address_snapshot.state}
                          </p>
                        )}

                        {order.paid_at && (
                          <p className="text-[11px] text-emerald-700 font-medium">
                            Confirmado em: {new Date(order.paid_at).toLocaleString('pt-BR')}
                            {order.payments && order.payments.length > 0 && (
                              <> • Ref: &quot;{order.payments[order.payments.length - 1].reference}&quot;</>
                            )}
                          </p>
                        )}

                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Itens do Pedido
                          </p>
                          {order.items?.map((item) => (
                            <div
                              key={item.id}
                              className="text-xs text-slate-800 flex justify-between py-1 font-medium"
                            >
                              <span>
                                {item.quantity}x {item.product_name}
                              </span>
                              <span className="font-bold text-slate-900">
                                R$ {Number(item.unit_price).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ))}
                          <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between font-extrabold text-teal-800 text-xs">
                            <span>TOTAL DO PEDIDO</span>
                            <span>R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações Operacionais */}
                      <div className="w-full lg:w-80 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
                        {order.payment_status === 'PENDENTE' && order.status !== 'CANCELADO' && (
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                              1. Confirmar Pagamento Demonstrativo
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
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => void confirmPayment(order.id, 'PAGO')}
                              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase tracking-wider text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <CheckCircle size={15} /> Registrar Pagamento PAGO
                            </button>
                          </div>
                        )}

                        {order.payment_status === 'ESTORNO_PENDENTE' && (
                          <button
                            type="button"
                            onClick={() => void confirmPayment(order.id, 'ESTORNADO')}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-wider text-xs py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            Registrar Estorno Demonstrativo
                          </button>
                        )}

                        {order.status === 'PENDENTE' && (
                          <button
                            type="button"
                            disabled={order.payment_status !== 'PAGO'}
                            onClick={() => void changeOrderStatus(order.id, 'CONFIRMADO')}
                            className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 text-white font-bold uppercase tracking-wider text-xs py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer"
                          >
                            {order.payment_status === 'PAGO'
                              ? '2. Avançar para CONFIRMADO'
                              : 'Aguardando Pagamento para Confirmar'}
                          </button>
                        )}

                        {order.status === 'CONFIRMADO' && (
                          <button
                            type="button"
                            onClick={() => void changeOrderStatus(order.id, 'SEPARADO')}
                            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold uppercase tracking-wider text-xs py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer"
                          >
                            Marcar como SEPARADO (Gera Entrega)
                          </button>
                        )}

                        {order.status === 'SEPARADO' && order.delivery && (
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                              <Truck size={13} className="text-teal-700" /> Atribuir Entregador (Status: {order.delivery.status}):
                            </label>
                            <select
                              onChange={(e) =>
                                void assignDeliverer(order.delivery!.id, Number(e.target.value))
                              }
                              value={order.delivery.deliverer_id || ''}
                              className="w-full bg-white border border-slate-200 text-slate-900 text-xs p-2 rounded-xl focus:border-teal-600 focus:outline-none font-medium"
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
                            className="w-full text-rose-600 hover:text-rose-700 font-bold uppercase text-[11px] py-1 cursor-pointer hover:underline"
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

          {/* ABA 2: CATÁLOGO E CATEGORIAS */}
          {activeTab === 'CATALOGO' && isAdmin && (
            <div className="space-y-8">
              {/* Categorias Permitidas */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-teal-800 mb-4">
                  Categorias do Escopo Não Alcoólico (Água, Sucos, Refrigerantes e Chás)
                </h2>

                <form
                  onSubmit={handleSaveCategory}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200"
                >
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Categoria Permitida
                    </label>
                    <select
                      value={catForm.name}
                      onChange={(e) =>
                        setCatForm({ ...catForm, name: e.target.value as AllowedCategoryName })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                    >
                      {ALLOWED_CATEGORY_NAMES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={catForm.description}
                      onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                      placeholder="Descrição da categoria..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold uppercase tracking-wider text-xs py-2.5 px-3 rounded-xl shadow-xs cursor-pointer"
                    >
                      {catForm.id ? 'Atualizar' : 'Salvar Categoria'}
                    </button>
                    {catForm.id && (
                      <button
                        type="button"
                        onClick={() =>
                          setCatForm({ name: 'Água', description: '', active: true })
                        }
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs px-3 py-2.5 rounded-xl font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-extrabold text-sm text-slate-900">{c.name}</span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                              c.active
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {c.active ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {c.description || 'Sem descrição'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200">
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
                              className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleCategoryActive(c)}
                              className="text-xs font-bold text-slate-500 hover:text-rose-600 ml-auto cursor-pointer"
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
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                      Produtos Cadastrados ({products.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
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
                            categories.find((c) => c.active)?.id || categories[0]?.id || ''
                          ),
                          price: '',
                          volume_ml: '350',
                          stock_quantity: '20',
                          description: '',
                          image_url: '',
                        });
                        setShowProductForm(true);
                      }}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus size={15} /> Novo Produto
                    </button>
                  )}
                </div>

                {showProductForm && (
                  <form
                    onSubmit={handleSaveProduct}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 space-y-4"
                  >
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800">
                      {editingProductId ? 'Editar Produto' : 'Cadastrar Novo Produto Não Alcoólico'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Nome do Produto
                        </label>
                        <input
                          type="text"
                          required
                          value={prodForm.name}
                          onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                          placeholder="Ex.: Água Mineral Sem Gás 500ml"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Marca
                        </label>
                        <input
                          type="text"
                          required
                          value={prodForm.brand}
                          onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                          placeholder="Ex.: Minalba"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Categoria
                        </label>
                        <select
                          required
                          value={prodForm.category_id}
                          onChange={(e) =>
                            setProdForm({ ...prodForm, category_id: e.target.value })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
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
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Preço (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          value={prodForm.price}
                          onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Volume (ml)
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={prodForm.volume_ml}
                          onChange={(e) => setProdForm({ ...prodForm, volume_ml: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                        />
                      </div>
                      {!editingProductId && (
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Estoque Inicial
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={prodForm.stock_quantity}
                            onChange={(e) =>
                              setProdForm({ ...prodForm, stock_quantity: e.target.value })
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                          />
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Descrição (Opcional)
                        </label>
                        <input
                          type="text"
                          value={prodForm.description}
                          onChange={(e) =>
                            setProdForm({ ...prodForm, description: e.target.value })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          URL da Imagem (Opcional)
                        </label>
                        <input
                          type="url"
                          value={prodForm.image_url}
                          onChange={(e) => setProdForm({ ...prodForm, image_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
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
                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold uppercase tracking-wider text-xs px-6 py-2 rounded-xl shadow-xs cursor-pointer"
                      >
                        {editingProductId ? 'Salvar Alterações' : 'Cadastrar Produto'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                        <th className="p-3.5">Produto</th>
                        <th className="p-3.5">Marca</th>
                        <th className="p-3.5">Categoria</th>
                        <th className="p-3.5">Volume</th>
                        <th className="p-3.5">Preço</th>
                        <th className="p-3.5 text-center">Estoque</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">{p.name}</td>
                          <td className="p-3.5 text-slate-600">{p.brand}</td>
                          <td className="p-3.5 text-slate-600">{p.category?.name}</td>
                          <td className="p-3.5 text-slate-600 font-mono">{p.volume_ml} ml</td>
                          <td className="p-3.5 text-teal-800 font-bold">
                            R$ {Number(p.price).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="p-3.5 text-center font-extrabold text-slate-900">
                            {p.stock_quantity}
                          </td>
                          <td className="p-3.5 text-center">
                            {p.active ? (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                Ativo
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                Inativo
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-2.5">
                            <button
                              type="button"
                              onClick={() => openEditProduct(p)}
                              className="text-teal-700 hover:text-teal-800 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 size={12} /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleProductActive(p)}
                              className="text-slate-500 hover:text-rose-600 font-bold cursor-pointer"
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

          {/* ABA 3: GESTÃO DE ESTOQUE */}
          {activeTab === 'ESTOQUE' && isAdmin && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                    Ajuste Manual de Estoque (Reposição, Perdas e Inventário)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toda movimentação registra data, responsável e motivo obrigatório.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lowStockOnly}
                      onChange={(e) => setLowStockOnly(e.target.checked)}
                      className="accent-teal-700 h-4 w-4"
                    />
                    Apenas estoque baixo (≤
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 text-center font-bold"
                  />
                  <span className="text-xs text-slate-700 font-medium">un.)</span>
                </div>
              </div>

              {/* Tabela de Saldos Atuais */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                      <th className="p-4">Produto</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4 text-center">Saldo Atual</th>
                      <th className="p-4 text-right">Movimentação / Histórico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStockProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">
                          {p.name}{' '}
                          {!p.active && (
                            <span className="text-[10px] text-rose-600 ml-1 font-semibold">(Inativo)</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600">{p.category?.name}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`font-extrabold text-xs px-2.5 py-1 rounded-lg border ${
                              p.stock_quantity === 0
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : p.stock_quantity <= 5
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {p.stock_quantity} un.
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => void openStockModal(p)}
                            className="bg-teal-700 hover:bg-teal-800 text-white font-bold uppercase tracking-wider text-xs px-3.5 py-2 rounded-xl shadow-xs cursor-pointer"
                          >
                            Ajustar / Ver Histórico
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Histórico Visível de Movimentações */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-teal-800 mb-3">
                  Movimentações de Estoque Registradas com Motivo
                </h3>
                {stockHistoryList.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Clique em &quot;Ajustar / Ver Histórico&quot; em qualquer produto acima para consultar ou registrar movimentações.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stockHistoryList.map((m) => (
                      <div
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
                      >
                        <div>
                          <span
                            className={`font-bold uppercase px-2 py-0.5 rounded-md border mr-2 text-[10px] ${
                              m.type === 'ENTRADA'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {m.type} ({m.type === 'ENTRADA' ? '+' : '-'}{m.quantity} un.)
                          </span>
                          <strong className="text-slate-900">Motivo:</strong>{' '}
                          <span className="text-slate-700">{m.reason}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {new Date(m.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal de Movimentação de Estoque */}
              {stockModalProduct && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                      Ajustar Estoque — {stockModalProduct.name}
                    </h3>
                    <p className="text-xs text-slate-600 mb-5">
                      Saldo atual:{' '}
                      <strong className="text-teal-700 font-extrabold text-sm">
                        {stockModalProduct.stock_quantity} unidades
                      </strong>
                    </p>

                    <form onSubmit={handleMoveStock} className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-teal-600"
                          >
                            <option value="ENTRADA">ENTRADA (Reposição)</option>
                            <option value="SAIDA">SAIDA (Perda / Ajuste)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-teal-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 font-medium"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStockModalProduct(null)}
                          className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                        >
                          Fechar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold uppercase tracking-wider text-xs py-2.5 rounded-xl shadow-xs cursor-pointer transition-colors"
                        >
                          Registrar Movimentação
                        </button>
                      </div>
                    </form>

                    <div className="border-t border-slate-200 pt-4 max-h-48 overflow-y-auto">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Últimas Movimentações Registradas
                      </p>
                      {stockHistoryList.length === 0 ? (
                        <p className="text-xs text-slate-500">Nenhuma movimentação encontrada.</p>
                      ) : (
                        <ul className="space-y-1.5 text-xs">
                          {stockHistoryList.map((m) => (
                            <li
                              key={m.id}
                              className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800"
                            >
                              <span>
                                <strong
                                  className={
                                    m.type === 'ENTRADA' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'
                                  }
                                >
                                  {m.type === 'ENTRADA' ? '+' : '-'}
                                  {m.quantity}
                                </strong>{' '}
                                — {m.reason}
                              </span>
                              <span className="text-slate-400 text-[10px] font-mono">
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

          {/* ABA 4: CUPONS DE DESCONTO */}
          {activeTab === 'CUPONS' && isAdmin && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-teal-800 mb-4">
                  Cadastrar ou Editar Cupom de Desconto
                </h2>
                <form
                  onSubmit={handleSaveCoupon}
                  className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
                >
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono font-bold focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                    >
                      <option value="PERCENTUAL">PERCENTUAL (%)</option>
                      <option value="FIXO">FIXO (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Início Vigência
                    </label>
                    <input
                      type="date"
                      required
                      value={couponForm.valid_from}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, valid_from: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Fim Vigência
                    </label>
                    <input
                      type="date"
                      required
                      value={couponForm.valid_until}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, valid_until: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold uppercase tracking-wider text-xs py-2.5 px-3 rounded-xl shadow-xs cursor-pointer"
                    >
                      {couponForm.id ? 'Atualizar' : 'Criar Cupom'}
                    </button>
                  </div>
                </form>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                        <th className="p-3.5">Código</th>
                        <th className="p-3.5">Tipo</th>
                        <th className="p-3.5">Desconto</th>
                        <th className="p-3.5">Vigência</th>
                        <th className="p-3.5 text-center">Ativo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {coupons.map((cp) => (
                        <tr key={cp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-mono font-extrabold text-teal-800">{cp.code}</td>
                          <td className="p-3.5 text-slate-600">{cp.discount_type}</td>
                          <td className="p-3.5 font-bold text-slate-900">
                            {cp.discount_type === 'PERCENTUAL'
                              ? `${Number(cp.discount_value)}%`
                              : `R$ ${Number(cp.discount_value).toFixed(2).replace('.', ',')}`}
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {cp.valid_from.slice(0, 10)} até {cp.valid_until.slice(0, 10)}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                                cp.active
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
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

          {/* ABA 5: EQUIPE INTERNA */}
          {activeTab === 'EQUIPE' && isAdmin && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-teal-800 mb-4">
                  Cadastrar Membro da Equipe (Atendente, Entregador ou Administrador)
                </h2>
                <form
                  onSubmit={handleCreateStaff}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
                >
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      E-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Senha Inicial (mín. 8)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600"
                    >
                      <option value="ATENDENTE">ATENDENTE</option>
                      <option value="ENTREGADOR">ENTREGADOR</option>
                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold uppercase tracking-wider text-xs py-2.5 px-3 rounded-xl shadow-xs cursor-pointer"
                    >
                      Cadastrar Equipe
                    </button>
                  </div>
                </form>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                        <th className="p-3.5">Nome</th>
                        <th className="p-3.5">E-mail</th>
                        <th className="p-3.5">Perfil</th>
                        <th className="p-3.5 text-center">Situação</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffList.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">{st.name}</td>
                          <td className="p-3.5 text-slate-600">{st.email}</td>
                          <td className="p-3.5">
                            <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">
                              {st.role}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                                st.active
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {st.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {st.id !== user.id && (
                              <button
                                type="button"
                                onClick={() => void handleToggleUserActive(st)}
                                className="text-slate-500 hover:text-slate-900 underline font-bold cursor-pointer"
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

          {/* ABA 6: RELATÓRIOS DE VENDAS */}
          {activeTab === 'RELATORIOS' && isAdmin && (
            <div className="space-y-6">
              {/* Filtro de Período */}
              <form
                onSubmit={runReport}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-end gap-4 shadow-xs"
              >
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={reportFrom}
                    onChange={(e) => setReportFrom(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={reportTo}
                    onChange={(e) => setReportTo(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Agrupamento Principal
                  </label>
                  <select
                    value={reportGroupBy}
                    onChange={(e) =>
                      setReportGroupBy(e.target.value as 'PRODUTO' | 'CATEGORIA' | 'PAGAMENTO')
                    }
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-teal-600"
                  >
                    <option value="CATEGORIA">Por Categoria Não Alcoólica</option>
                    <option value="PRODUTO">Por Produto Mais Vendido</option>
                    <option value="PAGAMENTO">Por Forma de Pagamento Demonstrativa</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
                >
                  Gerar Relatório
                </button>
              </form>

              {reportData && (
                <div className="space-y-6">
                  {/* KPI Cards com Alto Contraste (Texto Escuro em Fundo Claro) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Receita Demonstrativa (Pedidos Pagos)
                      </p>
                      <p className="text-2xl font-black text-teal-800">
                        R$ {Number(reportData.paid_revenue).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Exclui pedidos pendentes e cancelados
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Quantidade de Pedidos Pagos
                      </p>
                      <p className="text-2xl font-black text-slate-900">{reportData.paid_orders}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Totalmente liquidados no período
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Ticket Médio
                      </p>
                      <p className="text-2xl font-black text-slate-900">
                        R$ {Number(reportData.average_ticket).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Receita / Pedidos Pagos
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Descontos Concedidos
                      </p>
                      <p className="text-2xl font-black text-rose-700">
                        R$ {Number(reportData.discounts).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Cupons promocionais aplicados
                      </p>
                    </div>
                  </div>

                  {/* Agrupamento Selecionado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Produtos Mais Vendidos */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-4">
                        Produtos Mais Vendidos (Pedidos Pagos)
                      </h3>
                      {reportData.top_products.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          Nenhuma venda paga registrada no período.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-xs">
                          {reportData.top_products.map((tp) => (
                            <li
                              key={tp.product_id}
                              className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800"
                            >
                              <span className="font-bold text-slate-900">
                                {tp.name || `Produto #${tp.product_id}`}
                              </span>
                              <span className="text-teal-700 font-extrabold bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg">
                                {tp.quantity} un. vendidas
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Vendas por Categoria e Forma de Pagamento */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-1">
                        Vendas por Categoria e Forma de Pagamento
                      </h3>
                      {/* Legenda Explicativa exigida pela Tarefa 5 */}
                      <p className="text-[11px] text-slate-500 italic mb-4">
                        valores dos itens, sem frete e sem desconto
                      </p>

                      <div className="space-y-5">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                            Por Categoria Não Alcoólica:
                          </p>
                          {reportData.sales_by_category && reportData.sales_by_category.length > 0 ? (
                            <ul className="space-y-1.5 text-xs">
                              {reportData.sales_by_category.map((sc) => (
                                <li
                                  key={sc.category}
                                  className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800"
                                >
                                  <span>
                                    <strong className="text-slate-900 font-bold">{sc.category}</strong> ({sc.quantity} itens)
                                  </span>
                                  <span className="text-teal-800 font-extrabold">
                                    R$ {Number(sc.revenue).toFixed(2).replace('.', ',')}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500">Sem vendas por categoria.</p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                            Por Modalidade Demonstrativa (PIX / Cartão):
                          </p>
                          {reportData.orders_by_payment_method && reportData.orders_by_payment_method.length > 0 ? (
                            <ul className="space-y-1.5 text-xs">
                              {reportData.orders_by_payment_method.map((pm) => (
                                <li
                                  key={pm.payment_method}
                                  className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800"
                                >
                                  <span>
                                    <strong className="text-slate-900 font-bold">{pm.payment_method}</strong> ({pm.count} pedidos)
                                  </span>
                                  <span className="text-teal-800 font-extrabold">
                                    R$ {Number(pm.total).toFixed(2).replace('.', ',')}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500">Sem pagamentos confirmados.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Estoque Baixo */}
                  {reportData.low_stock.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 mb-3 flex items-center gap-2">
                        <AlertTriangle size={15} /> Produtos Ativos com Estoque Baixo (≤ 5 un.)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {reportData.low_stock.map((ls) => (
                          <span
                            key={ls.id}
                            className="bg-white border border-amber-200 px-3 py-1.5 rounded-xl text-xs text-slate-800 font-medium shadow-xs"
                          >
                            {ls.name}: <strong className="text-amber-700 font-bold">{ls.stock_quantity} un.</strong>
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
