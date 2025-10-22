import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    
    // Obtener todas las colecciones necesarias
    const [
      products,
      sales,
      cashTransactions,
      technicalServices,
      cashClosings
    ] = await Promise.all([
      db.collection('stock').find({}).toArray(),
      db.collection('sales').find({}).toArray(),
      db.collection('cashTransactions').find({}).toArray(),
      db.collection('technicalServices').find({}).toArray(),
      db.collection('cashClosings').find({}).toArray()
    ])

    // Calcular estadísticas de productos
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0)
    const lowStockProducts = products.filter(p => (p.quantity || 0) <= 5 && (p.quantity || 0) > 0).length
    const totalProductValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.quantity || 0), 0)

    // Calcular ventas totales
    const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0)
    const totalSalesCount = sales.length

    // Calcular ingresos y egresos de transacciones de caja
    const cashIncome = cashTransactions
      .filter(t => t.type === 'Ingreso')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const cashExpense = cashTransactions
      .filter(t => t.type === 'Egreso')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    // Calcular deudas pendientes
    const totalDebt = cashTransactions
      .filter(t => t.isDebt && (t.receivable || 0) > 0)
      .reduce((sum, t) => sum + (t.receivable || 0), 0)

    // Servicios técnicos
    const totalServicesRevenue = technicalServices
      .filter(s => s.isPaid)
      .reduce((sum, s) => sum + (s.price || 0), 0)
    
    const pendingServices = technicalServices.filter(s => !s.isPaid).length

    // Ventas por día (últimos 30 días)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split('T')[0]
    })
    
    const salesByDay = last30Days.map(day => {
      const daySales = sales.filter(s => {
        const saleDate = new Date(s.createdAt || s.paidAt).toISOString().split('T')[0]
        return saleDate === day
      })
      const dayTransactions = cashTransactions.filter(t => {
        const transDate = new Date(t.time || t.createdAt).toISOString().split('T')[0]
        return transDate === day && t.type === 'Ingreso'
      })
      
      const salesTotal = daySales.reduce((sum, s) => sum + (s.total || 0), 0)
      const transTotal = dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      
      return {
        date: new Date(day).toLocaleDateString('es', { day: '2-digit', month: 'short' }),
        ventas: Math.round(salesTotal),
        ingresos: Math.round(transTotal),
        cantidad: daySales.length
      }
    })

    // Ingresos vs Egresos por mes (últimos 6 meses)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      return {
        month: date.toLocaleDateString('es', { month: 'short' }),
        year: date.getFullYear(),
        monthNum: date.getMonth()
      }
    })
    
    const financialByMonth = last6Months.map(({ month, year, monthNum }) => {
      const monthIncome = cashTransactions.filter(t => {
        const tDate = new Date(t.time || t.createdAt)
        return tDate.getMonth() === monthNum && 
               tDate.getFullYear() === year && 
               t.type === 'Ingreso'
      }).reduce((sum, t) => sum + (t.amount || 0), 0)
      
      const monthExpense = cashTransactions.filter(t => {
        const tDate = new Date(t.time || t.createdAt)
        return tDate.getMonth() === monthNum && 
               tDate.getFullYear() === year && 
               t.type === 'Egreso'
      }).reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
      
      return {
        mes: month,
        ingresos: Math.round(monthIncome),
        egresos: Math.round(monthExpense),
        neto: Math.round(monthIncome - monthExpense)
      }
    })

    // Servicios técnicos por estado
    const servicesByStatus = [
      { name: 'Pagados', value: technicalServices.filter(s => s.isPaid).length, color: '#22c55e' },
      { name: 'Pendientes', value: technicalServices.filter(s => !s.isPaid).length, color: '#f59e0b' },
      { name: 'En proceso', value: technicalServices.filter(s => s.status === 'in_progress').length, color: '#3b82f6' }
    ].filter(s => s.value > 0)

    // Top productos más vendidos (basado en ventas)
    const productSales = new Map()
    sales.forEach(sale => {
      sale.items?.forEach((item: any) => {
        const current = productSales.get(item.name) || { quantity: 0, revenue: 0 }
        productSales.set(item.name, {
          quantity: current.quantity + (item.quantity || 0),
          revenue: current.revenue + (item.subtotal || 0)
        })
      })
    })
    
    const topProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 10)
      .map(([name, data]) => ({
        name: name.substring(0, 40) + (name.length > 40 ? '...' : ''),
        cantidad: data.quantity,
        ingresos: Math.round(data.revenue)
      }))

    // Métodos de pago más usados
    const paymentMethods = new Map()
    sales.forEach(sale => {
      const method = sale.paymentMethod || 'efectivo'
      paymentMethods.set(method, (paymentMethods.get(method) || 0) + 1)
    })
    
    const paymentMethodsData = Array.from(paymentMethods.entries())
      .map(([name, value]) => ({
        name: name === 'cash' ? 'Efectivo' : name === 'card' ? 'Tarjeta' : name === 'transfer' ? 'Transferencia' : name,
        value
      }))

    return NextResponse.json({
      stats: {
        totalProducts: products.length,
        totalStock,
        lowStockProducts,
        totalProductValue: Math.round(totalProductValue),
        totalSalesRevenue: Math.round(totalSalesRevenue),
        totalSalesCount,
        cashIncome: Math.round(cashIncome),
        cashExpense: Math.round(cashExpense),
        netCashFlow: Math.round(cashIncome - cashExpense),
        totalDebt: Math.round(totalDebt),
        totalServicesRevenue: Math.round(totalServicesRevenue),
        totalServices: technicalServices.length,
        pendingServices
      },
      charts: {
        salesByDay,
        financialByMonth,
        servicesByStatus,
        topProducts,
        paymentMethodsData
      }
    })
  } catch (error) {
    console.error("/api/dashboard/stats error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
