export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || isNaN(amount)) {
    return "$0"
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

// Caché en memoria para evitar múltiples lecturas a Firebase
const exchangeRateCache: Record<string, number> = {}

// Función para obtener la tasa de cambio desde Firebase
export async function fetchExchangeRate(type = "USD_ARS"): Promise<number> {
  try {
    // Verificar si ya tenemos la tasa en caché
    if (exchangeRateCache[type]) {
      return exchangeRateCache[type]
    }

    // Si no está en caché, obtener de Firebase
    const exchangeRateRef = doc(db, "exchangeRates", type)
    const exchangeRateSnap = await getDoc(exchangeRateRef)

    if (exchangeRateSnap.exists()) {
      const data = exchangeRateSnap.data()
      // Guardar en caché
      exchangeRateCache[type] = data.rate
      return data.rate
    }

    // Valor por defecto si no se encuentra
    return type === "USD_ARS" ? 1300 : 1
  } catch (error) {
    console.error("Error al obtener tasa de cambio:", error)
    // Valor por defecto en caso de error
    return type === "USD_ARS" ? 1300 : 1
  }
}

// Función sincrónica que devuelve el valor en caché o un valor por defecto
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  const type = `${fromCurrency}_${toCurrency}`

  // Usar el valor en caché si existe
  if (exchangeRateCache[type]) {
    return exchangeRateCache[type]
  }

  // Si no hay valor en caché, devolver un valor por defecto
  // y disparar una actualización en segundo plano
  if (fromCurrency === "USD" && toCurrency === "ARS") {
    // Actualizar la caché en segundo plano
    fetchExchangeRate("USD_ARS").then((rate) => {
      exchangeRateCache["USD_ARS"] = rate
    })
    return 1300 // Valor por defecto mientras se carga
  }

  return 1 // Valor por defecto para otras conversiones
}

// Inicializar la caché al cargar
if (typeof window !== "undefined") {
  // Cargar las tasas más comunes al iniciar
  fetchExchangeRate("USD_ARS")
  fetchExchangeRate("USD_REAL")
  fetchExchangeRate("USD_GUARANI")
}
