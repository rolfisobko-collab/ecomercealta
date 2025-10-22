import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import {
  CashTransaction,
  CashRegisterClosing,
  type Transaction,
  type CashClosing,
  type CashBalance,
  type Currency,
} from "@/models/CashRegister"

export interface CashMovement {
  id: string
  type: "income" | "expense" | "sale"
  amount: number
  description: string
  category?: string
  timestamp: Date
  userId?: string
  orderId?: string
  paymentMethod?: "cash" | "card" | "transfer"
}

export class CashRegisterService {
  private transactionsCollection = "cashTransactions"
  private closingsCollection = "cashClosings"
  private balancesCollection = "cashBalances"
  private salesCollection = "sales"
  private movementsCollection = "cash_movements"

  // Caché en memoria
  private transactionsCache: Map<string, Transaction[]> = new Map()
  private closingsCache: CashClosing[] | null = null
  private currentBalanceCache: CashBalance | null = null

  // Listeners para mantener la caché actualizada
  private listeners: Map<string, () => void> = new Map()

  constructor() {
    // Configurar listeners para mantener la caché actualizada
    this.setupListeners()
  }

  // Configurar listeners para mantener la caché actualizada
  private setupListeners() {
    // Listener para cierres de caja
    const closingsRef = collection(db, this.closingsCollection)
    const closingsUnsubscribe = onSnapshot(
      query(closingsRef, orderBy("date", "desc"), limit(50)),
      (snapshot) => {
        if (!snapshot.empty) {
          this.closingsCache = snapshot.docs.map((doc) => this.docToClosing(doc))
          console.log("Closings cache updated from Firestore")
        }
      },
      (error) => {
        console.error("Error in closings listener:", error)
      },
    )

    this.listeners.set("closings", closingsUnsubscribe)

    // Listener para el balance actual
    const balancesRef = collection(db, this.balancesCollection)
    const balancesUnsubscribe = onSnapshot(
      query(balancesRef, orderBy("date", "desc"), limit(1)),
      (snapshot) => {
        if (!snapshot.empty) {
          this.currentBalanceCache = snapshot.docs[0].data() as CashBalance
          console.log("Current balance cache updated from Firestore")
        }
      },
      (error) => {
        console.error("Error in balance listener:", error)
      },
    )

    this.listeners.set("balance", balancesUnsubscribe)
  }

  // Convertir documento de Firestore a objeto CashClosing
  private docToClosing(doc: QueryDocumentSnapshot<DocumentData>): CashClosing {
    const data = doc.data()
    return new CashRegisterClosing({
      id: doc.id,
      date: this.timestampToISOString(data.date),
      user: data.user || "",
      status: data.status || "Correcto",
      difference: data.difference || 0,
      notes: data.notes || "",
      balance: data.balance || {},
      createdAt: this.timestampToISOString(data.createdAt),
      updatedAt: this.timestampToISOString(data.updatedAt),
    })
  }

  // Convertir documento de Firestore a objeto Transaction
  private docToTransaction(doc: QueryDocumentSnapshot<DocumentData>): Transaction {
    const data = doc.data()
    return new CashTransaction({
      id: doc.id,
      closingId: data.closingId || "",
      time: this.timestampToISOString(data.time),
      type: data.type || "Ingreso",
      amount: data.amount || 0,
      currency: data.currency || "PESO",
      description: data.description || "",
      user: data.user || "",
      reference: data.reference || "",
      category: data.category || "",
      createdAt: this.timestampToISOString(data.createdAt),
      updatedAt: this.timestampToISOString(data.updatedAt),
    })
  }

  // FUNCIÓN CORREGIDA: Convertir venta a transacciones
  private saleToTransactions(saleDoc: QueryDocumentSnapshot<DocumentData>): Transaction[] {
    const sale = saleDoc.data()
    const transactions: Transaction[] = []

    console.log("🔄 Procesando venta para transacciones:", {
      id: saleDoc.id,
      saleNumber: sale.saleNumber,
      status: sale.status,
      paidAt: sale.paidAt,
      paymentDetails: sale.paymentDetails,
      total: sale.total,
      currency: sale.currency,
    })

    if (!sale.paidAt) {
      console.log("❌ Venta sin paidAt, saltando...")
      return transactions
    }

    const paidAt = this.timestampToISOString(sale.paidAt)
    const saleNumber = sale.saleNumber || `SALE-${saleDoc.id.substring(0, 8).toUpperCase()}`
    const isService = sale.isService || false
    const baseDescription = isService ? `Servicio Técnico - ${saleNumber}` : `Venta - ${saleNumber}`

    // Si hay paymentDetails (pago mixto), usar esos datos
    if (sale.paymentDetails && sale.paymentDetails.amounts) {
      const { amounts } = sale.paymentDetails
      console.log("💰 Procesando pago mixto:", amounts)

      // Crear transacciones para cada método de pago usado
      if (amounts.cashUSD && amounts.cashUSD > 0) {
        transactions.push(
          new CashTransaction({
            id: `${saleDoc.id}_usd`,
            closingId: "",
            time: paidAt,
            type: "Venta",
            amount: amounts.cashUSD,
            currency: "USD",
            description: `${baseDescription} (Efectivo USD)`,
            user: "Sistema Caja",
            reference: saleDoc.id,
            category: isService ? "servicio_tecnico" : "venta_productos",
            createdAt: paidAt,
            updatedAt: paidAt,
          }),
        )
      }

      if (amounts.usdt && amounts.usdt > 0) {
        transactions.push(
          new CashTransaction({
            id: `${saleDoc.id}_usdt`,
            closingId: "",
            time: paidAt,
            type: "Venta",
            amount: amounts.usdt,
            currency: "USDT",
            description: `${baseDescription} (USDT)`,
            user: "Sistema Caja",
            reference: saleDoc.id,
            category: isService ? "servicio_tecnico" : "venta_productos",
            createdAt: paidAt,
            updatedAt: paidAt,
          }),
        )
      }

      if (amounts.cashARS && amounts.cashARS > 0) {
        transactions.push(
          new CashTransaction({
            id: `${saleDoc.id}_peso`,
            closingId: "",
            time: paidAt,
            type: "Venta",
            amount: amounts.cashARS,
            currency: "PESO",
            description: `${baseDescription} (Efectivo ARS)`,
            user: "Sistema Caja",
            reference: saleDoc.id,
            category: isService ? "servicio_tecnico" : "venta_productos",
            createdAt: paidAt,
            updatedAt: paidAt,
          }),
        )
      }

      if (amounts.transferARS && amounts.transferARS > 0) {
        transactions.push(
          new CashTransaction({
            id: `${saleDoc.id}_transfer`,
            closingId: "",
            time: paidAt,
            type: "Venta",
            amount: amounts.transferARS,
            currency: "PESO_TRANSFERENCIA",
            description: `${baseDescription} (Transferencia ARS)`,
            user: "Sistema Caja",
            reference: saleDoc.id,
            category: isService ? "servicio_tecnico" : "venta_productos",
            createdAt: paidAt,
            updatedAt: paidAt,
          }),
        )
      }

      if (amounts.real && amounts.real > 0) {
        transactions.push(
          new CashTransaction({
            id: `${saleDoc.id}_real`,
            closingId: "",
            time: paidAt,
            type: "Venta",
            amount: amounts.real,
            currency: "REAL",
            description: `${baseDescription} (Real Brasileño)`,
            user: "Sistema Caja",
            reference: saleDoc.id,
            category: isService ? "servicio_tecnico" : "venta_productos",
            createdAt: paidAt,
            updatedAt: paidAt,
          }),
        )
      }

      if (amounts.guarani && amounts.guarani > 0) {
        transactions.push(
          new CashTransaction({
            id: `${saleDoc.id}_guarani`,
            closingId: "",
            time: paidAt,
            type: "Venta",
            amount: amounts.guarani,
            currency: "GUARANI",
            description: `${baseDescription} (Guaraní)`,
            user: "Sistema Caja",
            reference: saleDoc.id,
            category: isService ? "servicio_tecnico" : "venta_productos",
            createdAt: paidAt,
            updatedAt: paidAt,
          }),
        )
      }
    } else {
      // Si no hay paymentDetails, crear una transacción simple con el total
      console.log("💰 Procesando pago simple:", {
        total: sale.total,
        currency: sale.currency,
        paymentMethod: sale.paymentMethod,
      })

      // Determinar la moneda correcta
      let currency: Currency = "PESO"
      if (sale.currency === "USD") currency = "USD"
      else if (sale.currency === "USDT") currency = "USDT"
      else if (sale.currency === "REAL") currency = "REAL"
      else if (sale.currency === "GUARANI") currency = "GUARANI"

      transactions.push(
        new CashTransaction({
          id: `${saleDoc.id}_simple`,
          closingId: "",
          time: paidAt,
          type: "Venta",
          amount: sale.total || 0,
          currency: currency,
          description: `${baseDescription} (${sale.paymentMethod || "Efectivo"})`,
          user: "Sistema Caja",
          reference: saleDoc.id,
          category: isService ? "servicio_tecnico" : "venta_productos",
          createdAt: paidAt,
          updatedAt: paidAt,
        }),
      )
    }

    console.log(`✅ Venta ${saleDoc.id} → ${transactions.length} transacciones creadas`)
    return transactions
  }

  // Convertir Timestamp de Firestore a ISO string
  private timestampToISOString(timestamp: any): string {
    if (!timestamp) return new Date().toISOString()
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toISOString()
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toISOString()
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString()
    }
    return timestamp
  }

  // FUNCIÓN COMPLETAMENTE CORREGIDA: Obtener transacciones de una fecha específica
  async getTransactionsByDate(date: Date): Promise<Transaction[]> {
    try {
      console.log("🔍 INICIANDO BÚSQUEDA DE TRANSACCIONES POR FECHA")
      console.log("📅 Fecha seleccionada:", date.toISOString())
      console.log("📅 Fecha local:", date.toLocaleDateString())

      // Crear rango de fechas para el día completo
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      console.log("📅 Rango de búsqueda:", {
        inicio: startOfDay.toISOString(),
        fin: endOfDay.toISOString(),
      })

      const allTransactions: Transaction[] = []

      // Helper: convert a Mongo sale JSON to transactions (mirrors saleToTransactions)
      const mongoSaleToTransactions = (sale: any): Transaction[] => {
        const transactions: Transaction[] = []
        if (!sale?.paidAt) return transactions
        const paidAtISO = new Date(sale.paidAt).toISOString()
        const saleId = String(sale._id || sale.id || '')
        const saleNumber = sale.saleNumber || `SALE-${String(saleId).slice(-8).toUpperCase()}`
        const isService = !!sale.isService
        const baseDescription = isService ? `Servicio Técnico - ${saleNumber}` : `Venta - ${saleNumber}`

        if (sale.paymentDetails?.amounts) {
          const a = sale.paymentDetails.amounts
          if (a.cashUSD && a.cashUSD > 0) transactions.push(new CashTransaction({ id: `${saleId}_usd`, closingId: "", time: paidAtISO, type: "Venta", amount: a.cashUSD, currency: "USD", description: `${baseDescription} (Efectivo USD)`, user: "Sistema Caja", reference: saleId, category: isService ? "servicio_tecnico" : "venta_productos", createdAt: paidAtISO, updatedAt: paidAtISO }))
          if (a.usdt && a.usdt > 0) transactions.push(new CashTransaction({ id: `${saleId}_usdt`, closingId: "", time: paidAtISO, type: "Venta", amount: a.usdt, currency: "USDT", description: `${baseDescription} (USDT)`, user: "Sistema Caja", reference: saleId, category: isService ? "servicio_tecnico" : "venta_productos", createdAt: paidAtISO, updatedAt: paidAtISO }))
          if (a.cashARS && a.cashARS > 0) transactions.push(new CashTransaction({ id: `${saleId}_peso`, closingId: "", time: paidAtISO, type: "Venta", amount: a.cashARS, currency: "PESO", description: `${baseDescription} (Efectivo ARS)`, user: "Sistema Caja", reference: saleId, category: isService ? "servicio_tecnico" : "venta_productos", createdAt: paidAtISO, updatedAt: paidAtISO }))
          if (a.transferARS && a.transferARS > 0) transactions.push(new CashTransaction({ id: `${saleId}_transfer`, closingId: "", time: paidAtISO, type: "Venta", amount: a.transferARS, currency: "PESO_TRANSFERENCIA", description: `${baseDescription} (Transferencia ARS)`, user: "Sistema Caja", reference: saleId, category: isService ? "servicio_tecnico" : "venta_productos", createdAt: paidAtISO, updatedAt: paidAtISO }))
          if (a.real && a.real > 0) transactions.push(new CashTransaction({ id: `${saleId}_real`, closingId: "", time: paidAtISO, type: "Venta", amount: a.real, currency: "REAL", description: `${baseDescription} (Real Brasileño)`, user: "Sistema Caja", reference: saleId, category: isService ? "servicio_tecnico" : "venta_productos", createdAt: paidAtISO, updatedAt: paidAtISO }))
          if (a.guarani && a.guarani > 0) transactions.push(new CashTransaction({ id: `${saleId}_guarani`, closingId: "", time: paidAtISO, type: "Venta", amount: a.guarani, currency: "GUARANI", description: `${baseDescription} (Guaraní)`, user: "Sistema Caja", reference: saleId, category: isService ? "servicio_tecnico" : "venta_productos", createdAt: paidAtISO, updatedAt: paidAtISO }))
        } else {
          let currency: Currency = "PESO"
          if (sale.currency === "USD") currency = "USD"
          else if (sale.currency === "USDT") currency = "USDT"
          else if (sale.currency === "REAL") currency = "REAL"
          else if (sale.currency === "GUARANI") currency = "GUARANI"
          transactions.push(new CashTransaction({ id: `${saleId}_simple`, closingId: "", time: paidAtISO, type: "Venta", amount: Number(sale.total || 0), currency, description: `${baseDescription} (${sale.paymentMethod || "Efectivo"})`, user: "Sistema Caja", reference: saleId, category: isService ? "servicio_tecnico" : "venta_productos", createdAt: paidAtISO, updatedAt: paidAtISO }))
        }
        return transactions
      }

      // 1. OBTENER TRANSACCIONES MANUALES
      console.log("🔍 Obteniendo transacciones manuales...")
      const transactionsRef = collection(db, this.transactionsCollection)
      const manualQuery = query(
        transactionsRef,
        where("time", ">=", Timestamp.fromDate(startOfDay)),
        where("time", "<=", Timestamp.fromDate(endOfDay)),
      )

      try {
        const manualSnapshot = await getDocs(manualQuery)
        console.log("📄 Transacciones manuales encontradas:", manualSnapshot.size)

        manualSnapshot.docs.forEach((doc) => {
          const transaction = this.docToTransaction(doc)
          console.log("📄 Transacción manual:", {
            id: transaction.id,
            type: transaction.type,
            description: transaction.description,
            amount: transaction.amount,
            currency: transaction.currency,
            time: transaction.time,
          })
          allTransactions.push(transaction)
        })
      } catch (error) {
        console.error("Error obteniendo transacciones manuales:", error)
      }

      // 2. OBTENER VENTAS PAGADAS DESDE MONGO (API)
      console.log("🔍 Obteniendo ventas pagadas desde Mongo (API)...")
      try {
        const [paidRes, deliveredRes] = await Promise.all([
          fetch('/api/sales?status=paid', { cache: 'no-store' }),
          fetch('/api/sales?status=delivered', { cache: 'no-store' }),
        ])
        const paidSales = paidRes.ok ? await paidRes.json() : []
        const deliveredSales = deliveredRes.ok ? await deliveredRes.json() : []
        const allPaid = ([] as any[]).concat(Array.isArray(paidSales) ? paidSales : [], Array.isArray(deliveredSales) ? deliveredSales : [])
        console.log("🛒 Ventas (Mongo) encontradas:", allPaid.length)

        // Filtrar por rango de fecha usando paidAt
        const inRange = allPaid.filter((s: any) => {
          const paidAt = s.paidAt ? new Date(s.paidAt) : null
          return paidAt && paidAt >= startOfDay && paidAt <= endOfDay
        })
        console.log("🛒 Ventas en rango:", inRange.length)

        inRange.forEach((sale: any) => {
          const tx = mongoSaleToTransactions(sale)
          allTransactions.push(...tx)
        })
      } catch (error) {
        console.error("Error obteniendo ventas pagadas (Mongo API):", error)
      }

      // Ordenar todas las transacciones por tiempo descendente
      allTransactions.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

      console.log("🎯 RESULTADO FINAL:")
      console.log("📊 Total transacciones encontradas:", allTransactions.length)
      console.log(
        "📊 Transacciones manuales:",
        allTransactions.filter((t) => t.type === "Ingreso" || t.type === "Egreso").length,
      )
      console.log("📊 Ventas de caja:", allTransactions.filter((t) => t.type === "Venta").length)
      console.log("📅 Fecha filtrada:", date.toLocaleDateString())

      // Mostrar resumen de cada transacción encontrada
      allTransactions.forEach((t, index) => {
        const transactionDate = new Date(t.time)
        console.log(
          `${index + 1}. ${t.type} - ${t.description} - ${t.amount} ${t.currency} - ${transactionDate.toLocaleDateString()} ${transactionDate.toLocaleTimeString()}`,
        )
      })

      return allTransactions
    } catch (error) {
      console.error("❌ Error general en getTransactionsByDate:", error)
      return []
    }
  }

  // Registrar un nuevo egreso
  async addExpense(expense: {
    description: string
    amount: number
    currency: Currency
    category: string
    user: string
  }): Promise<Transaction | null> {
    try {
      const transactionData: Partial<Transaction> = {
        type: "Egreso",
        amount: expense.amount || 0,
        currency: expense.currency || "PESO",
        description: expense.description || "",
        category: expense.category || "",
        user: expense.user || "",
        time: new Date().toISOString(),
        closingId: "",
        reference: "",
      }

      const newTransaction = await this.addTransaction(transactionData)
      return newTransaction
    } catch (error) {
      console.error("Error adding expense:", error)
      return null
    }
  }

  // Registrar un nuevo ingreso
  async addIncome(income: {
    description: string
    amount: number
    currency: Currency
    category: string
    user: string
  }): Promise<Transaction | null> {
    try {
      console.log("🔄 Registrando ingreso:", income)

      const transactionData: Partial<Transaction> = {
        type: "Ingreso",
        amount: income.amount || 0,
        currency: income.currency || "PESO",
        description: income.description || "",
        category: income.category || "",
        user: income.user || "",
        time: new Date().toISOString(),
        closingId: "",
        reference: "",
      }

      console.log("🔄 Datos de transacción preparados:", transactionData)

      const newTransaction = await this.addTransaction(transactionData)

      if (newTransaction) {
        console.log("✅ Ingreso registrado exitosamente:", newTransaction.id)
      } else {
        console.error("❌ No se pudo crear la transacción")
      }

      return newTransaction
    } catch (error) {
      console.error("Error adding income:", error)
      return null
    }
  }

  // Registrar una nueva transacción
  async addTransaction(transaction: Partial<Transaction>): Promise<Transaction | null> {
    try {
      console.log("🔄 Agregando transacción:", transaction)

      const transactionsRef = collection(db, this.transactionsCollection)

      // Preparar datos para Firestore
      const newTransaction = new CashTransaction({
        id: "",
        closingId: transaction.closingId || "",
        time: transaction.time || new Date().toISOString(),
        type: transaction.type || "Ingreso",
        amount: transaction.amount || 0,
        currency: transaction.currency || "PESO",
        description: transaction.description || "",
        user: transaction.user || "",
        reference: transaction.reference || "",
        category: transaction.category || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      console.log("🔄 Nueva transacción preparada:", newTransaction)

      // Preparar datos para Firestore, eliminando campos undefined
      const firestoreData = {
        closingId: newTransaction.closingId,
        time: Timestamp.fromDate(new Date(newTransaction.time)),
        type: newTransaction.type,
        amount: newTransaction.amount,
        currency: newTransaction.currency,
        description: newTransaction.description,
        user: newTransaction.user,
        reference: newTransaction.reference,
        category: newTransaction.category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      console.log("🔄 Datos para Firestore:", firestoreData)

      // Agregar a Firestore
      const docRef = await addDoc(transactionsRef, firestoreData)
      console.log("✅ Documento creado con ID:", docRef.id)

      // Actualizar ID
      const addedTransaction = new CashTransaction({
        ...newTransaction,
        id: docRef.id,
      })

      return addedTransaction
    } catch (error) {
      console.error("Error adding transaction:", error)
      return null
    }
  }

  // Delete a transaction
  async deleteTransaction(transactionId: string): Promise<boolean> {
    try {
      const transactionRef = doc(db, this.transactionsCollection, transactionId)
      await deleteDoc(transactionRef)

      // Clear cache to force refresh
      this.transactionsCache.clear()
      this.currentBalanceCache = null

      console.log(`Transaction ${transactionId} deleted successfully`)
      return true
    } catch (error) {
      console.error("Error deleting transaction:", error)
      return false
    }
  }

  // Obtener movimientos de caja en tiempo real
  onMovementsUpdate(callback: (movements: CashMovement[]) => void) {
    const movementsRef = collection(db, this.movementsCollection)
    const q = query(movementsRef, orderBy("timestamp", "desc"))

    return onSnapshot(q, (snapshot) => {
      const movements: CashMovement[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        movements.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as CashMovement)
      })
      callback(movements)
    })
  }

  // Obtener ventas (incluye PAID y DELIVERED)
  async getSales(startDate?: Date, endDate?: Date): Promise<CashMovement[]> {
    try {
      const ordersRef = collection(db, this.salesCollection)
      let q = query(
        ordersRef,
        where("status", "in", ["paid", "delivered"]), // ✅ INCLUYE AMBOS ESTADOS
        orderBy("createdAt", "desc"),
      )

      if (startDate && endDate) {
        q = query(
          ordersRef,
          where("status", "in", ["paid", "delivered"]),
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
          where("createdAt", "<=", Timestamp.fromDate(endDate)),
          orderBy("createdAt", "desc"),
        )
      }

      const snapshot = await getDocs(q)
      const sales: CashMovement[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        sales.push({
          id: doc.id,
          type: "sale",
          amount: data.total || 0,
          description: `Venta #${doc.id.slice(-6)}`,
          timestamp: data.createdAt?.toDate() || new Date(),
          orderId: doc.id,
          paymentMethod: data.paymentMethod || "cash",
        })
      })

      return sales
    } catch (error) {
      console.error("Error getting sales:", error)
      return []
    }
  }

  // Calcular balance actual
  async getCurrentBalance(): Promise<CashBalance> {
    try {
      const movements = await this.getAllMovements()
      const sales = await this.getSales()

      const allTransactions = [...movements, ...sales]

      let cash = 0
      let card = 0
      let transfer = 0

      allTransactions.forEach((transaction) => {
        const amount = transaction.amount
        const method = transaction.paymentMethod || "cash"

        if (transaction.type === "income" || transaction.type === "sale") {
          switch (method) {
            case "cash":
              cash += amount
              break
            case "card":
              card += amount
              break
            case "transfer":
              transfer += amount
              break
          }
        } else if (transaction.type === "expense") {
          // Los gastos normalmente salen de efectivo
          cash -= amount
        }
      })

      return {
        cash,
        card,
        transfer,
        total: cash + card + transfer,
      }
    } catch (error) {
      console.error("Error calculating balance:", error)
      return { cash: 0, card: 0, transfer: 0, total: 0 }
    }
  }

  // Obtener todos los movimientos
  async getAllMovements(): Promise<CashMovement[]> {
    try {
      const movementsRef = collection(db, this.movementsCollection)
      const q = query(movementsRef, orderBy("timestamp", "desc"))
      const snapshot = await getDocs(q)

      const movements: CashMovement[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        movements.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as CashMovement)
      })

      return movements
    } catch (error) {
      console.error("Error getting movements:", error)
      return []
    }
  }

  // Obtener resumen por período
  async getPeriodSummary(startDate: Date, endDate: Date) {
    try {
      const movements = await this.getAllMovements()
      const sales = await this.getSales(startDate, endDate)

      const filteredMovements = movements.filter((m) => m.timestamp >= startDate && m.timestamp <= endDate)

      const allTransactions = [...filteredMovements, ...sales]

      let totalIncome = 0
      let totalExpenses = 0
      let totalSales = 0

      allTransactions.forEach((transaction) => {
        switch (transaction.type) {
          case "income":
            totalIncome += transaction.amount
            break
          case "expense":
            totalExpenses += transaction.amount
            break
          case "sale":
            totalSales += transaction.amount
            break
        }
      })

      return {
        totalIncome,
        totalExpenses,
        totalSales,
        netProfit: totalIncome + totalSales - totalExpenses,
        transactions: allTransactions,
      }
    } catch (error) {
      console.error("Error getting period summary:", error)
      return {
        totalIncome: 0,
        totalExpenses: 0,
        totalSales: 0,
        netProfit: 0,
        transactions: [],
      }
    }
  }

  // Limpiar listeners cuando ya no se necesiten
  cleanup() {
    this.listeners.forEach((unsubscribe) => unsubscribe())
    this.listeners.clear()
  }
}

// Singleton para usar en toda la aplicación
export const cashRegisterService = new CashRegisterService()
