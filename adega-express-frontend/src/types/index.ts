// src/types/index.ts

export type Role = 'CLIENTE' | 'ATENDENTE' | 'ADMINISTRADOR' | 'ENTREGADOR';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: string;
  volume_ml: number;
  abv_percent: string;
  brand: string;
  stock_quantity: number;
  image_url?: string;
  active: boolean;
  category: {
    id: number;
    name: string;
  };
  in_stock: boolean;
}

export interface OrderItem {
  id: number;
  quantity: number;
  unit_price: string;
  product: {
    id: number;
    name: string;
    brand: string;
    volume_ml: number;
  };
}

export interface Order {
  id: number;
  status: string;
  total: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
  coupon?: {
    code: string;
    discount_type: string;
    discount_value: string;
  };
  items?: OrderItem[];
  _count?: {
    items: number;
  };
}
