import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { addToCart, createCart, getCart, removeFromCart, shopifyConfigured, type CartLine } from "./shopify";

const STORAGE_KEY = "ev_cart_id";

type CartContextValue = {
  cartId: string | null;
  checkoutUrl: string | null;
  lines: CartLine[];
  totalQuantity: number;
  isOpen: boolean;
  isLoading: boolean;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined" || !shopifyConfigured()) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    setIsLoading(true);
    getCart(stored)
      .then((cart) => {
        if (cart) {
          setCartId(cart.id);
          setCheckoutUrl(cart.checkoutUrl);
          setLines(cart.lines);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => window.localStorage.removeItem(STORAGE_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const ensureCart = useCallback(async (): Promise<string> => {
    if (cartId) return cartId;
    const cart = await createCart();
    setCartId(cart.id);
    setCheckoutUrl(cart.checkoutUrl);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, cart.id);
    return cart.id;
  }, [cartId]);

  const addItem = useCallback(async (variantId: string, quantity = 1) => {
    setIsLoading(true);
    try {
      const id = await ensureCart();
      const cart = await addToCart(id, variantId, quantity);
      setCheckoutUrl(cart.checkoutUrl);
      setLines(cart.lines);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [ensureCart]);

  const removeItem = useCallback(async (lineId: string) => {
    if (!cartId) return;
    setIsLoading(true);
    try {
      await removeFromCart(cartId, lineId);
      const cart = await getCart(cartId);
      setLines(cart?.lines ?? []);
      if (cart) setCheckoutUrl(cart.checkoutUrl);
    } finally {
      setIsLoading(false);
    }
  }, [cartId]);

  const clearCart = useCallback(() => {
    setCartId(null);
    setCheckoutUrl(null);
    setLines([]);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartId,
        checkoutUrl,
        lines,
        totalQuantity,
        isOpen,
        isLoading,
        addItem,
        removeItem,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        clearCart,
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
