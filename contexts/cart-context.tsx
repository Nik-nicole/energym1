"use client";

import { createContext, useContext, useReducer, useEffect, useState, ReactNode } from "react";

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  categoria: string;
  stock: number;
  sede: {
    id: string;
    nombre: string;
  };
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: any) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] };

const CartContext = createContext<CartContextType | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
            : item
        );
        return calculateTotals({ ...state, items: updatedItems });
      } else {
        const newItems = [...state.items, { ...action.payload, quantity: 1 }];
        return calculateTotals({ ...state, items: newItems });
      }
    }
    
    case "REMOVE_ITEM": {
      const newItems = state.items.filter(item => item.id !== action.payload);
      return calculateTotals({ ...state, items: newItems });
    }
    
    case "UPDATE_QUANTITY": {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        const newItems = state.items.filter(item => item.id !== id);
        return calculateTotals({ ...state, items: newItems });
      }
      
      const newItems = state.items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      );
      return calculateTotals({ ...state, items: newItems });
    }
    
    case "CLEAR_CART":
      return { items: [], total: 0, itemCount: 0 };
    
    case "LOAD_CART":
      return calculateTotals({ ...state, items: action.payload });
    
    default:
      return state;
  }
}

function calculateTotals(state: CartState): CartState {
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.items.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  
  return {
    ...state,
    itemCount,
    total
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0
  });
  
  const [isOpen, setIsOpen] = useState(false);

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: "LOAD_CART", payload: parsedCart });
      } catch (error) {
        console.error("Error loading cart:", error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (product: any) => {
    const cartItem: CartItem = {
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      imagen: product.imagen,
      categoria: product.categoria,
      stock: product.stock,
      sede: product.sede || { id: 'default', nombre: 'Sede por defecto' },
      quantity: 1
    };
    dispatch({ type: "ADD_ITEM", payload: cartItem });
    // Abrir el carrito automáticamente al agregar un producto
    setIsOpen(true);
  };

  const removeItem = (productId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id: productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  return (
    <CartContext.Provider value={{
      items: state.items,
      total: state.total,
      itemCount: state.itemCount,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isOpen,
      setIsOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
