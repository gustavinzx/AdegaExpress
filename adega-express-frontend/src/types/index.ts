// src/types/index.ts

export type Role = 'CLIENTE' | 'ATENDENTE' | 'ADMINISTRADOR' | 'ENTREGADOR';

export type AllowedCategoryName = 'Água' | 'Sucos' | 'Refrigerantes' | 'Chás';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active?: boolean;
  birth_date?: string | null;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  active?: boolean;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: string;
  volume_ml: number;
  abv_percent?: string;
  brand: string;
  stock_quantity: number;
  image_url?: string | null;
  active: boolean;
  category_id?: number;
  category: {
    id: number;
    name: string;
    active?: boolean;
  };
  in_stock: boolean;
}

export interface Address {
  id: number;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
  archived?: boolean;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string | null;
  quantity: number;
  unit_price: string;
  product: {
    id: number;
    name: string;
    brand: string;
    volume_ml: number;
    image_url?: string | null;
  };
}

export interface PaymentRecord {
  id: number;
  order_id: number;
  status: 'PENDENTE' | 'PAGO' | 'ESTORNO_PENDENTE' | 'ESTORNADO';
  method: 'PIX' | 'CARTAO';
  amount: string;
  reference: string;
  actor_id?: number | null;
  created_at: string;
  actor?: {
    id: number;
    name: string;
    email: string;
    role: Role;
  } | null;
}

export interface OrderHistoryRecord {
  id: number;
  order_id: number;
  status: string;
  changed_by?: number | null;
  reason?: string | null;
  created_at: string;
}

export interface DeliveryRecord {
  id: number;
  order_id: number;
  deliverer_id?: number | null;
  status: 'AGUARDANDO' | 'SAIU_PARA_ENTREGA' | 'ENTREGUE';
  dispatched_at?: string | null;
  delivered_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deliverer?: {
    id: number;
    name: string;
    email: string;
  } | null;
  order?: Order;
}

export interface Order {
  id: number;
  status: 'PENDENTE' | 'CONFIRMADO' | 'SEPARADO' | 'EM_ROTA' | 'ENTREGUE' | 'CANCELADO';
  subtotal?: string;
  discount?: string;
  shipping_fee?: string;
  total: string;
  payment_method: 'PIX' | 'CARTAO';
  payment_status: 'PENDENTE' | 'PAGO' | 'ESTORNO_PENDENTE' | 'ESTORNADO';
  payment_reference?: string | null;
  paid_at?: string | null;
  paid_by_id?: number | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  cancellation_reason?: string | null;
  address_snapshot?: {
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  address?: {
    id?: number;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
  coupon?: {
    id?: number;
    code: string;
    discount_type: 'PERCENTUAL' | 'VALOR_FIXO';
    discount_value: string;
  } | null;
  items?: OrderItem[];
  delivery?: DeliveryRecord | null;
  payments?: PaymentRecord[];
  history?: OrderHistoryRecord[];
  _count?: {
    items: number;
  };
}

export interface OrderQuote {
  address: Address;
  coupon?: {
    id: number;
    code: string;
    discount_type: 'PERCENTUAL' | 'VALOR_FIXO';
    discount_value: string;
  } | null;
  items: {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    line_total: string;
  }[];
  subtotal: string;
  discount: string;
  shipping_fee: string;
  total: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'PERCENTUAL' | 'FIXO' | 'VALOR_FIXO';
  discount_value: string;
  valid_from: string;
  valid_until: string;
  max_uses?: number | null;
  used_count?: number;
  active: boolean;
}

export interface StockMovement {
  id: number;
  product_id: number;
  actor_id?: number | null;
  user_id?: number | null;
  type: 'ENTRADA' | 'SAIDA';
  quantity: number;
  reason?: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface SalesReport {
  period: {
    from: string;
    to: string;
    timezone: string;
    basis: string;
    group_by?: 'PRODUTO' | 'CATEGORIA' | 'PAGAMENTO' | null;
  };
  orders_by_status: {
    status: string;
    _count: { _all: number };
    _sum: { total: string | null };
  }[];
  orders_by_payment_method?: {
    payment_method: string;
    count: number;
    total: string;
  }[];
  sales_by_category?: {
    category: string;
    quantity: number;
    revenue: string;
  }[];
  paid_orders: number;
  paid_revenue: string;
  discounts: string;
  shipping: string;
  average_ticket: string;
  pending_refunds: {
    count: number;
    total: string | null;
  };
  top_products: {
    product_id: number;
    name?: string;
    quantity: number;
  }[];
  low_stock: {
    id: number;
    name: string;
    stock_quantity: number;
  }[];
}
