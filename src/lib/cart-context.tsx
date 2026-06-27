import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type CartItem = {
  /** local id (e.g. `pack:<uuid>` or `membership`) — stable for dedup */
  id: string;
  kind: "pack" | "membership";
  /** pack uuid; undefined for membership */
  packId?: string;
  title: string;
  priceCents: number;
  image?: string | null;
};

const STORAGE_KEY = "ev_cart_v2";

type CartContextValue = {
  items: CartItem[];
  totalCents: number;
  totalQuantity: number;
  isOpen: boolean;
  isLoading: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  checkout: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  // Clear cart on sign-out so it doesn't persist across accounts.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setItems([]);
        if (typeof window !== "undefined") {
          try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => (prev.find((p) => p.id === item.id) ? prev : [...prev, item]));
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalCents = useMemo(() => items.reduce((s, i) => s + i.priceCents, 0), [items]);

  const checkout = useCallback(async () => {
    if (items.length === 0) return;
    setIsLoading(true);
    try {
      const validItems = items.filter(
        (i) => i.kind === "membership" || (i.kind === "pack" && !!i.packId),
      );
      if (validItems.length === 0) {
        toast.error("Your cart is empty or contains invalid items.");
        return;
      }
      const { startCartCheckout } = await import("./checkout-client");
      await startCartCheckout(validItems);
    } finally {
      setIsLoading(false);
    }
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCents,
        totalQuantity: items.length,
        isOpen,
        isLoading,
        addItem,
        removeItem,
        clearCart,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
