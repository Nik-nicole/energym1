"use client";

import { useCart } from "@/contexts/cart-context";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

export function CartButton() {
  const { itemCount, setIsOpen } = useCart();

  return (
    <motion.button
      onClick={() => {
        setIsOpen(true);
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-3 hover:bg-white/10 rounded-lg transition-colors"
    >
      <ShoppingBag className="w-6 h-6 text-white" />
      
      {itemCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-[#D604E0] rounded-full text-white text-xs font-medium flex items-center justify-center"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </motion.span>
      )}
    </motion.button>
  );
}
