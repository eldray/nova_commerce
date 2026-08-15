import React, { createContext, useContext, ReactNode } from "react";

const TooltipContext = createContext<any>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipContext.Provider value={{}}>{children}</TooltipContext.Provider>;
}

export function useTooltip() {
  return useContext(TooltipContext);
}
