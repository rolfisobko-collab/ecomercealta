import type { Currency } from "./types"

// Tasas de conversión (ejemplo)
export const conversionRates: Record<string, Record<string, number>> = {
  USD: {
    PESO: 1050,
    REAL: 5.5,
    GUARANI: 7300,
    USDT: 1,
  },
  USDT: {
    PESO: 1050,
    REAL: 5.5,
    GUARANI: 7300,
    USD: 1,
  },
  PESO: {
    USD: 0.00095,
    REAL: 0.0052,
    GUARANI: 6.95,
    PESO_TRANSFERENCIA: 1,
  },
  PESO_TRANSFERENCIA: {
    USD: 0.00095,
    REAL: 0.0052,
    GUARANI: 6.95,
    PESO: 1,
  },
  REAL: {
    USD: 0.18,
    PESO: 190,
    GUARANI: 1330,
  },
  GUARANI: {
    USD: 0.00014,
    PESO: 0.14,
    REAL: 0.00075,
  },
}

// Función para convertir entre monedas
export const convertCurrency = (amount: number, from: Currency, to: Currency): number => {
  if (from === to) return amount

  // Si son equivalentes (USD/USDT o PESO/PESO_TRANSFERENCIA)
  if (
    (from === "USD" && to === "USDT") ||
    (from === "USDT" && to === "USD") ||
    (from === "PESO" && to === "PESO_TRANSFERENCIA") ||
    (from === "PESO_TRANSFERENCIA" && to === "PESO")
  ) {
    return amount
  }

  return amount * (conversionRates[from]?.[to] || 0)
}

// Función para formatear monedas
export const formatCurrency = (amount: number, currency: Currency): string => {
  const formatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: getCurrencyCode(currency),
    minimumFractionDigits: 2,
  })

  return formatter.format(amount)
}

// Función para obtener el código ISO de la moneda
const getCurrencyCode = (currency: Currency): string => {
  switch (currency) {
    case "USD":
    case "USDT":
      return "USD"
    case "PESO":
    case "PESO_TRANSFERENCIA":
      return "ARS"
    case "REAL":
      return "BRL"
    case "GUARANI":
      return "PYG"
    default:
      return "USD"
  }
}
