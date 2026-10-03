import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  cardPrice?: number;
  installmentCount?: number;
  img: string;
  quantity: number;
  color?: string | null;
  finish?: string | null;
  variant?: string | null;
}

export function cartItemKey(item: Pick<CartItem, "id" | "color" | "finish" | "variant">) {
  return `${item.id}__${item.color ?? ""}__${item.finish ?? ""}__${item.variant ?? ""}`;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (key: string, delta: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "mobili_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const hydrated = useRef(false);

  // Load persisted cart (client only, after hydration)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved) as CartItem[]);
    } catch {
      // ignore corrupted storage
    }
    hydrated.current = true;
  }, []);

  // Persist on change
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable
    }
  }, [items]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback<CartContextValue["addItem"]>((item) => {
    const quantity = item.quantity ?? 1;
    setItems((prev) => {
      const key = cartItemKey(item);
      const existing = prev.find((i) => cartItemKey(i) === key);
      if (existing) {
        return prev.map((i) =>
          cartItemKey(i) === key ? { ...i, ...item, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { ...item, quantity }];
    });
    toast.success(`${item.name} adicionado ao carrinho!`);
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback((key: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => (cartItemKey(i) === key ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => {
      const item = prev.find((i) => cartItemKey(i) === key);
      if (item) toast(`${item.name} removido do carrinho.`);
      return prev.filter((i) => cartItemKey(i) !== key);
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const { count, total } = useMemo(
    () => ({
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        isOpen,
        openCart,
        closeCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
