"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/cart-context";
import { CartSidebar } from "@/components/ui/cart-sidebar";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <CartSidebar />
      </CartProvider>
    </SessionProvider>
  );
}
