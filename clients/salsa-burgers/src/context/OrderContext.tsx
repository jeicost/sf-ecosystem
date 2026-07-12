"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type OrderContextType = {
  isOpen: boolean;
  openOrder: () => void;
  closeOrder: () => void;
};

const OrderContext = createContext<OrderContextType>({
  isOpen: false,
  openOrder: () => {},
  closeOrder: () => {},
});

export function OrderProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <OrderContext.Provider value={{ isOpen, openOrder: () => setIsOpen(true), closeOrder: () => setIsOpen(false) }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  return useContext(OrderContext);
}
