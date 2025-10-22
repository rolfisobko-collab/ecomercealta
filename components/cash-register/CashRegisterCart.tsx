"use client"

import { useState } from "react"
import { useCart } from "@/context/CartContext"
import type { CashCartItem, Currency } from "./types"
import type { Transaction } from "@/services/api/types"

// Add this right after all the imports, before the CashRegisterCart component:
declare global {
  interface Window {
    reloadBalanceAndTransactions?: () => Promise<void>
    reloadCashRegisterData?: () => void
  }
}

// Definimos el componente como una función normal
const CashRegisterCart = () => {
  const { addItem, clearCart } = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CashCartItem[]>(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cashRegisterCart")
      if (savedCart) {
        try {
          return JSON.parse(savedCart)
        } catch (error) {
          console.error("Error parsing cart from localStorage:", error)
        }
      }
    }
    return []
  })
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false)
  // Estado para rastrear si hay un servicio en progreso
  const [hasServiceInProgress, setHasServiceInProgress] = useState(false)
  // Primero, agregar un nuevo estado para controlar la visibilidad de la sección de deudas y para almacenar las transacciones con deudas
  // Agregar después de la línea donde se declara isServiceFormOpen

  const [isDebtListOpen, setIsDebtListOpen] = useState<boolean>(false)
  const [debtTransactions, setDebtTransactions] = useState<Transaction[]>([])
  const [isLoadingDebts, setIsLoadingDebts] = useState<boolean>(false)
  const [debtPage, setDebtPage] = useState<number>(1)
  const [totalDebtPages, setTotalDebtPages] = useState<number>(1)
  const [dollarToPesoRate, setDollarToPesoRate] = useState<number>(1000) // Valor inicial del dólar en pesos
  const [isExpensesOpen, setIsExpensesOpen] = useState<boolean>(false)
  const [devicePattern, setDevicePattern] = useState<number[]>([])
  const [unlockMethod, setUnlockMethod] = useState<string>("password")
  const [isRegistering, setIsRegistering] = useState<boolean>(false)
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false)
  // Cerca del inicio del componente, donde están los otros estados, reemplaza:
  // const [activeTab, setActiveTab] = useState<string>("cart");
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Intentar recuperar el tab activo del localStorage
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("cashRegisterActiveTab")
      // Si hay un tab guardado, usarlo; de lo contrario, usar "cart"
      return savedTab || "cart"
    }
    return "cart"
  })

  // Estado para el servicio técnico
  const [servicePrice, setServicePrice] = useState<number>(0)
  const [serviceCurrency, setServiceCurrency] = useState<Currency>("PESO")

  // Estados para los campos del formulario de servicio
  const [customerName, setCustomerName] = useState<string>("")
  const [customerDNI, setCustomerDNI] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [deviceBrand, setDeviceBrand] = useState<string>("")
  const [deviceModel, setDeviceModel] = useState<string>("")
  const [issueDescription, setIssueDescription] = useState<string>("")
  const [devicePassword, setDevicePassword] = useState<string>("")

  // Estado para movimientos de caja
  const [movementAmount, setMovementAmount] = useState<number>(0)
  const [movementCurrency, setMovementCurrency] = useState<Currency>("PESO")
  const [movementType, setMovementType] = useState<"expense" | "income">("expense")
  const [selectedExpenseType, setSelectedExpenseType] = useState<string>("")
  const [selectedIncomeType, setSelectedIncomeType] = useState<string>("")
  const [otherExpenseDescription, setOtherExpenseDescription] = useState<string>("")
  const [otherIncomeDescription, setOtherIncomeDescription] = useState<string>("")

  // Estado para mostrar el resumen
  const [showSummary, setShowSummary] = useState<boolean>(true)
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(() => {
    // Intentar recuperar la preferencia de moneda del localStorage
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("preferredCurrency")
      // Si no hay moneda guardada o es inválida, usar PESO por defecto
      return savedCurrency === "USD" || savedCurrency === "PESO" ? (savedCurrency as Currency) : "PESO"
    }
    return "PESO"
  })

  // Estado para medios de pago
  const [cashUSD, setCashUSD] = useState<number>(0)
  const [usdtAmount, setUsdtAmount] = useState<number>(0)
  const [cashARS, setCashARS] = useState<number>(0)
  const [transferARS, setTransferARS] = useState<number>(0)
  const [realAmount, setRealAmount] = useState<number>(0)
  const [guaraniAmount, setGuaraniAmount] = useState<number>(0)
  const [realRate, setRealRate] = useState<number>(5.5)
  const [guaraniRate, setGuaraniRate] = useState<number>(7300)

  // Agregar después de los estados de montos
  const [isDebtUSD, setIsDebtUSD] = useState<boolean>(false)
  const [isDebtUSDT, setIsDebtUSDT] = useState<boolean>(false)
  const [isDebtARS, setIsDebtARS] = useState<boolean>(false)
  const [isDebtTransferARS, setIsDebtTransferA\
