"use client"

import { createContext, useContext } from "react"

interface GremioUI {
  openCart?: () => void
}

const GremioUIContext = createContext<GremioUI | null>(null)

export function GremioUIProvider({ value, children }: { value: GremioUI; children: React.ReactNode }) {
  return <GremioUIContext.Provider value={value}>{children}</GremioUIContext.Provider>
}

export function useGremioUI() {
  return useContext(GremioUIContext)
}
