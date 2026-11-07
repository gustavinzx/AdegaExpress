// src/contexts/CartContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product } from '../types';
import toast from 'react-hot-toast';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => boolean;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadStoredCart = async () => {
      await Promise.resolve();
      const stored = localStorage.getItem('cart');
      if (stored) {
        try {
          const parsed: CartItem[] = JSON.parse(stored);
          setItems(
            parsed.filter(
              (i) => i.product && i.product.stock_quantity > 0 && i.quantity > 0,
            ),
          );
        } catch {
          setItems([]);
        }
      }
      setIsLoaded(true);
    };
    void loadStoredCart();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (product: Product, quantity = 1): boolean => {
    if (!product.in_stock || product.stock_quantity <= 0) {
      toast.error('Este produto está em falta e não pode ser adicionado ao carrinho.');
      return false;
    }
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      toast.error('Informe uma quantidade inteira positiva.');
      return false;
    }

    let added = false;
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const targetQty = currentQty + quantity;

      if (targetQty > product.stock_quantity) {
        toast.error(
          `Estoque insuficiente para ${product.name}. Disponível: ${product.stock_quantity} un.`,
        );
        return prev;
      }

      added = true;
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, product, quantity: targetQty } : item,
        );
      }
      return [...prev, { product, quantity }];
    });
    return added;
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    if (!Number.isInteger(quantity)) {
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        if (quantity > item.product.stock_quantity) {
          toast.error(
            `Quantidade máxima disponível em estoque: ${item.product.stock_quantity} un.`,
          );
          return { ...item, quantity: item.product.stock_quantity };
        }
        return { ...item, quantity };
      }),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce(
    (acc, item) => acc + parseFloat(item.product.price) * item.quantity,
    0,
  );
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
