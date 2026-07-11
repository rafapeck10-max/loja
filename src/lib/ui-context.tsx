import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface UIContextValue {
  menuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <UIContext.Provider value={{ menuOpen, openMenu, closeMenu }}>{children}</UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI deve ser usado dentro de <UIProvider>");
  return ctx;
}
