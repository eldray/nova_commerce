import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../helpers/useAuth';
import { ThemeModeProvider } from '../helpers/ThemeModeProvider';
import { CartProvider } from '../helpers/CartContext';
import { TooltipProvider } from './Tooltip';
import { SonnerToaster } from './SonnerToaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

export function GlobalContextProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <SonnerToaster />
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  );
}
