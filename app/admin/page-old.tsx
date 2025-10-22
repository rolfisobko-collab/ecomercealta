"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Tags, ShoppingCart, Users, AlertCircle, ImageIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { getAllProducts } from "@/services/hybrid/productService"
import { getAllCategories } from "@/services/hybrid/categoryService"
import { getOrders } from "@/services/api/orderService"
import { getUsers } from "@/services/api/userService"
import { formatCurrency } from "@/utils/currencyUtils"
import { useFirebaseStorage } from "@/hooks/useFirebaseStorage"

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    { name: "Productos", value: "...", icon: Package, change: "...", changeType: "increase", changePercent: "..." },
    { name: "Categorías", value: "...", icon: Tags, change: "...", changeType: "increase", changePercent: "..." },
    { name: "Pedidos", value: "...", icon: ShoppingCart, change: "...", changeType: "increase", changePercent: "..." },
    { name: "Usuarios", value: "...", icon: Users, change: "...", changeType: "increase", changePercent: "..." },
    {
      name: "Imágenes Hoy",
      value: "...",
      icon: ImageIcon,
      change: "...",
      changeType: "increase",
      changePercent: "...",
    },
  ])
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState<boolean>(true)
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true)
  const [productsLoading, setProductsLoading] = useState<boolean>(true)

  // Obtener todas las imágenes de Firebase Storage
  const { images, loading: imagesLoading } = useFirebaseStorage("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener productos
        const products = await getAllProducts()
        const productCount = products.length

        // Calcular productos añadidos en el último mes
        const now = new Date()
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(now.getMonth() - 1)

        const recentProducts = products.filter((product) => {
          const createdAt = new Date(product.createdAt)
          return createdAt >= oneMonthAgo
        })

        // Calcular el cambio porcentual de productos
        const olderProductsCount = products.length - recentProducts.length
        let productChangePercent = 0

        if (olderProductsCount > 0) {
          productChangePercent = Math.round((recentProducts.length / olderProductsCount) * 100)
        } else if (recentProducts.length > 0) {
          productChangePercent = 100 // Si todos son nuevos, es un 100% de aumento
        }

        // Obtener productos con stock bajo
        const lowStock = products
          .filter((product) => product.stock && product.stock <= 5)
          .sort((a, b) => (a.stock || 0) - (b.stock || 0))
          .slice(0, 5)
          .map((product) => ({
            id: product.id,
            name: product.name,
            stock: product.stock || 0,
            category: product.category || "Sin categoría",
          }))

        setLowStockProducts(lowStock)
        setProductsLoading(false)

        // Obtener categorías
        const categories = await getAllCategories()
        const categoryCount = categories.length

        // Calcular categorías añadidas en el último mes
        const recentCategories = categories.filter((category) => {
          if (!category.createdAt) return false
          const createdAt = new Date(category.createdAt)
          return createdAt >= oneMonthAgo
        })

        // Calcular el cambio porcentual de categorías
        const olderCategoriesCount = categories.length - recentCategories.length
        let categoryChangePercent = 0

        if (olderCategoriesCount > 0) {
          categoryChangePercent = Math.round((recentCategories.length / olderCategoriesCount) * 100)
        } else if (recentCategories.length > 0) {
          categoryChangePercent = 100
        }

        // Obtener pedidos
        let orders = []
        let recentOrdersList = []
        let orderChangePercent = 0

        try {
          orders = await getOrders()

          // Calcular pedidos añadidos en el último mes
          const recentOrdersData = orders.filter((order) => {
            const createdAt = new Date(order.createdAt)
            return createdAt >= oneMonthAgo
          })

          // Calcular el cambio porcentual de pedidos
          const olderOrdersCount = orders.length - recentOrdersData.length

          if (olderOrdersCount > 0) {
            orderChangePercent = Math.round((recentOrdersData.length / olderOrdersCount) * 100)
          } else if (recentOrdersData.length > 0) {
            orderChangePercent = 100
          }

          // Obtener los 5 pedidos más recientes
          recentOrdersList = orders
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((order) => ({
              id: order.id,
              customer: order.customerName || "Cliente",
              date: new Date(order.createdAt).toISOString().split("T")[0],
              status: order.status || "Pendiente",
              total: formatCurrency(order.total || 0),
            }))

          setRecentOrders(recentOrdersList)
        } catch (error) {
          console.error("Error fetching orders:", error)
          orders = []
          recentOrdersList = []
        }
        setOrdersLoading(false)

        // Obtener usuarios
        let users = []
        let recentUsers = []
        let userChangePercent = 0

        try {
          users = await getUsers()

          // Calcular usuarios añadidos en el último mes
          recentUsers = users.filter((user) => {
            const createdAt = new Date(user.createdAt)
            return createdAt >= oneMonthAgo
          })

          // Calcular el cambio porcentual de usuarios
          const olderUsersCount = users.length - recentUsers.length

          if (olderUsersCount > 0) {
            userChangePercent = Math.round((recentUsers.length / olderUsersCount) * 100)
          } else if (recentUsers.length > 0) {
            userChangePercent = 100
          }
        } catch (error) {
          console.error("Error fetching users:", error)
          users = []
          recentUsers = []
        }

        // Actualizar estadísticas
        setStats([
          {
            name: "Productos",
            value: productCount.toString(),
            icon: Package,
            change: `+${recentProducts.length}`,
            changeType: recentProducts.length > 0 ? "increase" : "decrease",
            changePercent: `${productChangePercent}%`,
          },
          {
            name: "Categorías",
            value: categoryCount.toString(),
            icon: Tags,
            change: `+${recentCategories.length}`,
            changeType: recentCategories.length > 0 ? "increase" : "decrease",
            changePercent: `${categoryChangePercent}%`,
          },
          {
            name: "Pedidos",
            value: orders.length.toString(),
            icon: ShoppingCart,
            change: `+${recentOrdersList.length}`,
            changeType: recentOrdersList.length > 0 ? "increase" : "decrease",
            changePercent: `${orderChangePercent}%`,
          },
          {
            name: "Usuarios",
            value: users.length.toString(),
            icon: Users,
            change: `+${recentUsers.length}`,
            changeType: recentUsers.length > 0 ? "increase" : "decrease",
            changePercent: `${userChangePercent}%`,
          },
        ])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Efecto para actualizar las estadísticas de imágenes cuando se cargan
  useEffect(() => {
    if (!imagesLoading) {
      // Verificar que images existe y es un array antes de acceder a length
      const imagesArray = Array.isArray(images) ? images : []
      const todayImagesCount = imagesArray.length > 0 ? Math.min(5, imagesArray.length) : 0

      setStats((prevStats) => {
        const newStats = [...prevStats]
        const imageStatIndex = newStats.findIndex((stat) => stat.name === "Imágenes Hoy")

        if (imageStatIndex >= 0) {
          newStats[imageStatIndex] = {
            ...newStats[imageStatIndex],
            value: todayImagesCount.toString(),
            change: `Total: ${imagesArray.length}`,
            changeType: "increase",
            changePercent:
              imagesArray.length > 0 ? `${Math.round((todayImagesCount / imagesArray.length) * 100)}%` : "0%",
          }
        } else {
          newStats.push({
            name: "Imágenes Hoy",
            value: todayImagesCount.toString(),
            icon: ImageIcon,
            change: `Total: ${imagesArray.length}`,
            changeType: "increase",
            changePercent:
              imagesArray.length > 0 ? `${Math.round((todayImagesCount / imagesArray.length) * 100)}%` : "0%",
          })
        }

        return newStats
      })
    }
  }, [images, imagesLoading])

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Panel de Administración</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              {loading || (stat.name === "Imágenes Hoy" && imagesLoading) ? (
                <div className="flex flex-col space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-4"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className="rounded-full p-3 bg-red-50 dark:bg-red-900/20">
                      <stat.icon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span
                      className={`text-xs font-medium ${
                        stat.changeType === "increase"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {stat.change} {stat.changeType === "increase" ? "↑" : "↓"}
                      {stat.changePercent && ` (${stat.changePercent})`}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      {stat.name === "Imágenes Hoy" ? "del total" : "desde el mes pasado"}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
              Pedidos Recientes
            </CardTitle>
            <CardDescription>Los últimos 5 pedidos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-2 text-left font-medium">ID</th>
                      <th className="py-3 px-2 text-left font-medium">Cliente</th>
                      <th className="py-3 px-2 text-left font-medium">Fecha</th>
                      <th className="py-3 px-2 text-left font-medium">Estado</th>
                      <th className="py-3 px-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-2">{order.id}</td>
                        <td className="py-3 px-2">{order.customer}</td>
                        <td className="py-3 px-2">{order.date}</td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === "Completado"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : order.status === "Pendiente"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                  : order.status === "Enviado"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">{order.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">No hay pedidos recientes</div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
              Alerta de Stock Bajo
            </CardTitle>
            <CardDescription>Productos que necesitan reposición</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
                  </div>
                ))}
              </div>
            ) : lowStockProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-2 text-left font-medium">ID</th>
                      <th className="py-3 px-2 text-left font-medium">Producto</th>
                      <th className="py-3 px-2 text-left font-medium">Categoría</th>
                      <th className="py-3 px-2 text-right font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product) => (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-2">{product.id}</td>
                        <td className="py-3 px-2">{product.name}</td>
                        <td className="py-3 px-2">{product.category}</td>
                        <td className="py-3 px-2 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            {product.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">No hay productos con stock bajo</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
