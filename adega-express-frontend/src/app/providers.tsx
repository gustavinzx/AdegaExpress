'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#181411',
              color: '#f4efe6',
              border: '1px solid rgba(201, 162, 86, 0.28)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500,
            },
          }}
        />
        {children}
      </CartProvider>
    </AuthProvider>
  );
}
