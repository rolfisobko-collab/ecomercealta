"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Wrench, AlertTriangle, ArrowUpRight, ArrowDownRight, Tags } from "lucide-react"
import { useEffect, useState } from "react"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { AdminPasswordProtection } from "@/components/admin/AdminPasswordProtection"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
    totalCategories: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalServices: 0,
    pendingServices: 0,
    totalOrders: 0,
    totalDebt: 0
  })
  
  const [salesByDay, setSalesByDay] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([])
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([])
  const [servicesByStatus, setServicesByStatus] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Cargar TODOS los datos desde una sola API optimizada
      const response = await fetch('/api/dashboard-data')
      const data = await response.json()

      if (data.error) {
        console.error('❌ API Error:', data.message)
        return
      }

      const { products, cashTransactions, sales, technicalServices } = data

      console.log('📊 Products loaded:', products.length)
      console.log('📊 Cash transactions loaded:', cashTransactions.length)
      console.log('📊 Sales loaded:', sales.length)
      console.log('📊 Technical services loaded:', technicalServices.length)

      // Calcular estadísticas de productos (convertir a número correctamente)
      const totalStock = products.reduce((sum: number, p: any) => {
        const qty = parseInt(p.quantity) || 0
        return sum + (isNaN(qty) ? 0 : qty)
      }, 0)
      const lowStock = products.filter((p: any) => {
        const qty = parseInt(p.quantity) || 0
        return !isNaN(qty) && qty <= 5 && qty > 0
      })

      // Calcular ingresos y egresos CORRECTAMENTE
      const ingresos = cashTransactions.filter((t: any) => t.type === 'Ingreso')
      const egresos = cashTransactions.filter((t: any) => t.type === 'Egreso')
      
      const totalIngresos = ingresos.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
      const totalEgresos = egresos.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)

      // Deudas pendientes
      const debts = cashTransactions.filter((t: any) => t.isDebt && (t.receivable || 0) > 0)
      const totalDebt = debts.reduce((sum: number, d: any) => sum + (d.receivable || 0), 0)

      console.log('💰 Total ingresos:', totalIngresos)
      console.log('💸 Total egresos:', totalEgresos)
      console.log('📊 Total deudas:', totalDebt)

      setStats({
        totalProducts: products.length,
        totalStock,
        lowStockProducts: lowStock.length,
        totalCategories: 0,
        totalSales: ingresos.length,
        totalRevenue: totalIngresos,
        totalExpenses: totalEgresos,
        totalServices: technicalServices.length,
        pendingServices: technicalServices.filter((s: any) => !s.isPaid).length,
        totalOrders: 0,
        totalDebt
      })

      // Ventas por día (últimos 30 días)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return date.toISOString().split('T')[0]
      })
      
      const salesByDayData = last30Days.map(day => {
        const dayIngresos = ingresos.filter((t: any) => {
          const tDate = new Date(t.time || t.createdAt).toISOString().split('T')[0]
          return tDate === day
        })
        const dayEgresos = egresos.filter((t: any) => {
          const tDate = new Date(t.time || t.createdAt).toISOString().split('T')[0]
          return tDate === day
        })
        
        const ingresosTotal = dayIngresos.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
        const egresosTotal = dayEgresos.reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0)
        
        return {
          date: new Date(day).toLocaleDateString('es', { day: '2-digit', month: 'short' }),
          ventas: Math.round(ingresosTotal),
          ingresos: Math.round(ingresosTotal),
          egresos: Math.round(egresosTotal),
          cantidad: dayIngresos.length
        }
      })
      
      console.log('📈 Sales by day:', salesByDayData.filter(d => d.ingresos > 0))
      setSalesByDay(salesByDayData)

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
        const monthIngresos = ingresos.filter((t: any) => {
          const tDate = new Date(t.time || t.createdAt)
          return tDate.getMonth() === monthNum && tDate.getFullYear() === year
        }).reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
        
        const monthEgresos = egresos.filter((t: any) => {
          const tDate = new Date(t.time || t.createdAt)
          return tDate.getMonth() === monthNum && tDate.getFullYear() === year
        }).reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0)
        
        return {
          mes: month,
          ingresos: Math.round(monthIngresos),
          egresos: Math.round(monthEgresos),
          neto: Math.round(monthIngresos - monthEgresos)
        }
      })
      
      console.log('📊 Financial by month:', financialByMonth)
      setRevenueByMonth(financialByMonth)

      // Análisis de descripciones para productos más vendidos
      const productSales = new Map()
      ingresos.forEach((t: any) => {
        const desc = t.description || ''
        // Extraer nombre del producto de la descripción
        const match = desc.match(/Venta: \d+x (.+?) \|/)
        if (match) {
          const productName = match[1]
          const current = productSales.get(productName) || { cantidad: 0, ingresos: 0 }
          productSales.set(productName, {
            cantidad: current.cantidad + 1,
            ingresos: current.ingresos + (t.amount || 0)
          })
        }
      })
      
      const topProds = Array.from(productSales.entries())
        .sort((a, b) => b[1].cantidad - a[1].cantidad)
        .slice(0, 10)
        .map(([name, data]) => ({
          name: name.substring(0, 40) + (name.length > 40 ? '...' : ''),
          cantidad: data.cantidad,
          ingresos: Math.round(data.ingresos)
        }))
      
      console.log('🏆 Top products:', topProds)
      setTopProducts(topProds)

      // Métodos de pago desde sales (agrupados correctamente)
      const paymentMethods: { [key: string]: number } = {}
      sales.forEach((sale: any) => {
        let method = (sale.paymentMethod || 'cash').toLowerCase()
        // Normalizar nombres
        if (method === 'cash' || method === 'efectivo') method = 'Efectivo'
        else if (method === 'card' || method === 'tarjeta') method = 'Tarjeta'
        else if (method === 'transfer' || method === 'transferencia') method = 'Transferencia'
        else if (method === 'mixed' || method === 'mixto') method = 'Mixto'
        else method = method.charAt(0).toUpperCase() + method.slice(1)
        
        paymentMethods[method] = (paymentMethods[method] || 0) + 1
      })
      
      const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({
        name,
        value
      }))
      console.log('💳 Payment methods:', paymentData)
      setCategoryDistribution(paymentData.length > 0 ? paymentData : [{ name: 'Sin datos', value: 1 }])

      // Servicios técnicos por estado
      const serviceStates = [
        { name: 'Pagados', value: technicalServices.filter((s: any) => s.isPaid).length, color: '#22c55e' },
        { name: 'Pendientes', value: technicalServices.filter((s: any) => !s.isPaid).length, color: '#f59e0b' }
      ].filter(s => s.value > 0)
      setServicesByStatus(serviceStates)

    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <AdminPasswordProtection>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del negocio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventario</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Productos en catálogo
            </p>
            {stats.lowStockProducts > 0 && (
              <div className="flex items-center text-xs text-orange-600 mt-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stats.lowStockProducts} con stock bajo
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalSales.toLocaleString()} transacciones
            </p>
            <div className="flex items-center text-xs text-green-600 mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              Activo
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${stats.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gastos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deudas Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${stats.totalDebt.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Por cobrar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 - Ventas e Ingresos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Ventas e Ingresos últimos 30 días */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Ventas e Ingresos - Últimos 30 Días</CardTitle>
            <CardDescription>Evolución diaria de ventas e ingresos en caja</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Area type="monotone" dataKey="ventas" stroke="#ef4444" fillOpacity={1} fill="url(#colorVentas)" name="Ventas" />
                <Area type="monotone" dataKey="ingresos" stroke="#22c55e" fillOpacity={1} fill="url(#colorIngresos)" name="Ingresos Caja" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ingresos vs Egresos por mes */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Ingresos vs Egresos</CardTitle>
            <CardDescription>Últimos 6 meses - Flujo de caja</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="ingresos" fill="#22c55e" radius={[8, 8, 0, 0]} name="Ingresos" />
                <Bar dataKey="egresos" fill="#ef4444" radius={[8, 8, 0, 0]} name="Egresos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Productos y Métodos de Pago */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top 10 productos más vendidos */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top 10 Productos Más Vendidos</CardTitle>
            <CardDescription>Por cantidad vendida</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={200} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'cantidad') return [`${value} unidades`, 'Vendidas']
                  if (name === 'ingresos') return [`$${value.toLocaleString()}`, 'Ingresos']
                  return value
                }} />
                <Legend />
                <Bar dataKey="cantidad" fill="#ef4444" radius={[0, 8, 8, 0]} name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Métodos de pago más usados */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
            <CardDescription>Distribución de pagos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 - Servicios y Resumen */}
      <div className="grid gap-4 md:grid-cols-2">
        {servicesByStatus.length > 0 && (
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Servicios Técnicos</CardTitle>
              <CardDescription>Estado actual de {stats.totalServices} servicios</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={servicesByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {servicesByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
            <CardDescription>Balance general del negocio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div>
                <p className="text-sm font-medium text-green-900">Total Ingresos</p>
                <p className="text-2xl font-bold text-green-700">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div>
                <p className="text-sm font-medium text-orange-900">Deudas Pendientes</p>
                <p className="text-2xl font-bold text-orange-700">${stats.totalDebt.toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div>
                <p className="text-sm font-medium text-blue-900">Servicios Técnicos</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalServices}</p>
                <p className="text-xs text-blue-600">{stats.pendingServices} pendientes de pago</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 4 - Flujo de Caja Neto */}
      <Card>
        <CardHeader>
          <CardTitle>Flujo de Caja Neto - Últimos 6 Meses</CardTitle>
          <CardDescription>Diferencia entre ingresos y egresos (Ganancia/Pérdida)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="neto" stroke="#8b5cf6" strokeWidth={3} name="Flujo Neto" dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accesos directos a funciones principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <a href="/admin/products/new" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent hover:shadow-md transition-all">
              <Package className="h-8 w-8 text-red-600" />
              <div>
                <p className="font-medium">Nuevo Producto</p>
                <p className="text-xs text-muted-foreground">Agregar al inventario</p>
              </div>
            </a>
            
            <a href="/admin/ventas" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent hover:shadow-md transition-all">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">Punto de Venta</p>
                <p className="text-xs text-muted-foreground">Registrar venta</p>
              </div>
            </a>
            
            <a href="/admin/servicios" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent hover:shadow-md transition-all">
              <Wrench className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium">Servicio Técnico</p>
                <p className="text-xs text-muted-foreground">Nuevo servicio</p>
              </div>
            </a>
            
            <a href="/admin/deudas" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent hover:shadow-md transition-all">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div>
                <p className="font-medium">Gestionar Deudas</p>
                <p className="text-xs text-muted-foreground">${stats.totalDebt.toLocaleString()} pendiente</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {stats.lowStockProducts > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800">
              Hay <strong>{stats.lowStockProducts} productos</strong> con stock bajo (≤5 unidades). 
              <a href="/admin/products" className="ml-2 underline font-medium">Ver productos</a>
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </AdminPasswordProtection>
  )
}
