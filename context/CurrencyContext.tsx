"use client"

import { createContext, useContext, useState } from "react"

interface CurrencyContextType {
  currency: "ARS" | "USD"
  setCurrency: (currency: "ARS" | "USD") => void
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "ARS",
  setCurrency: () => {},
})

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS")

  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>
}

export const useCurrency = () => {
  return useContext(CurrencyContext)
}
