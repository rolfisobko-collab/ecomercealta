"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, LogOut, ShoppingBag, Heart, MapPin } from "lucide-react"
import ProfileInfo from "@/components/profile/ProfileInfo"
import OrderHistory from "@/components/profile/OrderHistory"
import AddressList from "@/components/profile/AddressList"
import { authService } from "@/services/auth/authService"
import { toast } from "@/components/ui/use-toast"
import FavoritesPreview from "@/components/profile/FavoritesPreview"

// Añadir estilos CSS para la animación fadeIn si no existe en globals.css
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}
`

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("info")

  // Scroll to top on page load and check for hash in URL
  useEffect(() => {
    window.scrollTo(0, 0)

    // Verificar si hay un hash en la URL y establecer la pestaña activa
    if (typeof window !== "undefined") {
      const hash = window.location.hash
      if (hash === "#favorites") {
        setActiveTab("favorites")
      } else if (hash === "#orders") {
        setActiveTab("orders")
      }
    }

    // Añadir los estilos de animación si no existen
    if (typeof document !== "undefined") {
      if (!document.getElementById("profile-animations")) {
        const styleEl = document.createElement("style")
        styleEl.id = "profile-animations"
        styleEl.innerHTML = fadeInAnimation
        document.head.appendChild(styleEl)
      }
    }
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/profile")
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    try {
      await authService.signOut()
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })
      router.push("/")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión. Intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  if (loading || !user) {
    return null // Loading state is handled by loading.tsx
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-black pt-8 pb-16 px-4 sm:px-6 transition-all duration-300 ease-in-out">
      <div className="container max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 relative inline-block">
            Mi cuenta
            <span className="absolute -bottom-1 left-0 w-1/2 h-1 bg-red-600 rounded-full"></span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Gestiona tu información y preferencias</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Con diseño mejorado */}
          <div className="w-full lg:w-1/4 shrink-0">
            <div className="sticky top-20 rounded-xl bg-white dark:bg-gray-800/90 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
              {/* Perfil Header */}
              <div className="relative">
                <div className="bg-gradient-to-r from-red-500 to-red-700 dark:from-red-700 dark:to-red-900 h-28 w-full">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                  <Avatar className="h-24 w-24 ring-4 ring-white dark:ring-gray-800 shadow-md">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || "Usuario"} />
                    <AvatarFallback className="text-xl bg-gradient-to-r from-red-600 to-red-700 text-white">
                      {user.displayName ? getInitials(user.displayName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Datos del usuario */}
              <div className="pt-16 pb-6 px-6 text-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{user.displayName || "Usuario"}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                <Badge
                  variant="secondary"
                  className="mt-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full"
                >
                  Cliente
                </Badge>
              </div>

              <Separator className="mx-4 opacity-70" />

              {/* Navegación */}
              <div className="p-4">
                <div className="space-y-2">
                  <Button
                    variant={activeTab === "info" ? "default" : "ghost"}
                    className={`w-full justify-start rounded-lg ${
                      activeTab === "info"
                        ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                    } transition-all duration-200`}
                    onClick={() => setActiveTab("info")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </Button>
                  <Button
                    variant={activeTab === "orders" ? "default" : "ghost"}
                    className={`w-full justify-start rounded-lg ${
                      activeTab === "orders"
                        ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                    } transition-all duration-200`}
                    onClick={() => setActiveTab("orders")}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Mis Pedidos
                  </Button>
                  <Button
                    variant={activeTab === "addresses" ? "default" : "ghost"}
                    className={`w-full justify-start rounded-lg ${
                      activeTab === "addresses"
                        ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                    } transition-all duration-200`}
                    onClick={() => setActiveTab("addresses")}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Mis Direcciones
                  </Button>
                  <Button
                    variant={activeTab === "favorites" ? "default" : "ghost"}
                    className={`w-full justify-start rounded-lg ${
                      activeTab === "favorites"
                        ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                    } transition-all duration-200`}
                    onClick={() => setActiveTab("favorites")}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Mis Favoritos
                  </Button>
                  <Separator className="my-3 opacity-70" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-all duration-200"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main content - Con diseño mejorado */}
          <div className="w-full lg:w-3/4 transition-all duration-300 ease-in-out">
            <div className="bg-white dark:bg-gray-800/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
              {activeTab === "info" && (
                <div className="animate-fadeIn">
                  <div className="flex items-center mb-6">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Información Personal</h2>
                      <p className="text-gray-500 dark:text-gray-400">Actualiza tus datos personales</p>
                    </div>
                  </div>

                  {/* Estilizado para ProfileInfo */}
                  <div className="profile-info-wrapper">
                    <style jsx>{`
                      /* Estilos para los componentes hijos de ProfileInfo */
                      :global(.profile-info-wrapper form) {
                        background: linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0)) !important;
                        backdrop-filter: blur(8px);
                        border-radius: 12px;
                        padding: 1.5rem;
                        border: 1px solid rgba(229, 231, 235, 0.5);
                        transition: all 0.3s ease;
                      }
                      
                      :global(.dark .profile-info-wrapper form) {
                        background: linear-gradient(to bottom, rgba(30,30,30,0.5), rgba(20,20,20,0.3)) !important;
                        border: 1px solid rgba(75, 85, 99, 0.3);
                      }
                      
                      :global(.profile-info-wrapper label) {
                        font-weight: 500;
                        color: #374151;
                        margin-bottom: 0.5rem;
                        display: block;
                        transition: all 0.2s ease;
                      }
                      
                      :global(.dark .profile-info-wrapper label) {
                        color: #e5e7eb;
                      }
                      
                      :global(.profile-info-wrapper input) {
                        border-radius: 8px !important;
                        border: 1px solid #e5e7eb;
                        transition: all 0.2s ease;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                      }
                      
                      :global(.dark .profile-info-wrapper input) {
                        background-color: rgba(30, 41, 59, 0.5);
                        border-color: #374151;
                      }
                      
                      :global(.profile-info-wrapper input:focus) {
                        border-color: #ef4444;
                        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
                      }
                      
                      :global(.profile-info-wrapper button[type="submit"]) {
                        background: linear-gradient(to right, #ef4444, #dc2626);
                        border: none;
                        color: white;
                        font-weight: 500;
                        padding: 0.625rem 1.25rem;
                        border-radius: 8px;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1);
                      }
                      
                      :global(.profile-info-wrapper button[type="submit"]:hover) {
                        transform: translateY(-1px);
                        box-shadow: 0 6px 10px -1px rgba(239, 68, 68, 0.25), 0 4px 6px -1px rgba(239, 68, 68, 0.15);
                      }
                      
                      :global(.profile-info-wrapper .form-group) {
                        margin-bottom: 1.5rem;
                        position: relative;
                      }
                      
                      :global(.profile-info-wrapper .form-icon) {
                        position: absolute;
                        top: 38px;
                        left: 12px;
                        color: #9ca3af;
                      }
                      
                      :global(.dark .profile-info-wrapper .form-icon) {
                        color: #6b7280;
                      }
                      
                      :global(.profile-info-wrapper .form-group input) {
                        padding-left: 2.5rem;
                      }
                    `}</style>
                    <ProfileInfo user={user} />
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div id="orders" className="animate-fadeIn">
                  <div className="flex items-center mb-6">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mis Pedidos</h2>
                      <p className="text-gray-500 dark:text-gray-400">Historial de tus compras</p>
                    </div>
                  </div>

                  {/* Estilizado para OrderHistory */}
                  <div className="order-history-wrapper">
                    <style jsx>{`
                      :global(.order-history-wrapper table) {
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                        border: 1px solid rgba(229, 231, 235, 0.5);
                      }
                      
                      :global(.dark .order-history-wrapper table) {
                        border: 1px solid rgba(75, 85, 99, 0.3);
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
                      }
                      
                      :global(.order-history-wrapper th) {
                        background: linear-gradient(to right, #f9fafb, #f3f4f6);
                        color: #1f2937;
                        font-weight: 600;
                        text-transform: uppercase;
                        font-size: 0.75rem;
                        letter-spacing: 0.05em;
                        padding: 0.75rem 1rem;
                      }
                      
                      :global(.dark .order-history-wrapper th) {
                        background: linear-gradient(to right, #1f2937, #111827);
                        color: #e5e7eb;
                      }
                      
                      :global(.order-history-wrapper td) {
                        padding: 1rem;
                        border-bottom: 1px solid #e5e7eb;
                        transition: all 0.2s ease;
                      }
                      
                      :global(.dark .order-history-wrapper td) {
                        border-bottom: 1px solid #374151;
                      }
                      
                      :global(.order-history-wrapper tr:hover td) {
                        background-color: rgba(249, 250, 251, 0.8);
                      }
                      
                      :global(.dark .order-history-wrapper tr:hover td) {
                        background-color: rgba(31, 41, 55, 0.7);
                      }
                      
                      :global(.order-history-wrapper .order-status) {
                        padding: 0.25rem 0.75rem;
                        border-radius: 9999px;
                        font-size: 0.75rem;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                      }
                      
                      :global(.order-history-wrapper .status-completed) {
                        background-color: rgba(16, 185, 129, 0.1);
                        color: #10b981;
                      }
                      
                      :global(.order-history-wrapper .status-processing) {
                        background-color: rgba(59, 130, 246, 0.1);
                        color: #3b82f6;
                      }
                      
                      :global(.order-history-wrapper .status-cancelled) {
                        background-color: rgba(239, 68, 68, 0.1);
                        color: #ef4444;
                      }
                      
                      :global(.dark .order-history-wrapper .status-completed) {
                        background-color: rgba(16, 185, 129, 0.2);
                      }
                      
                      :global(.dark .order-history-wrapper .status-processing) {
                        background-color: rgba(59, 130, 246, 0.2);
                      }
                      
                      :global(.dark .order-history-wrapper .status-cancelled) {
                        background-color: rgba(239, 68, 68, 0.2);
                      }
                      
                      :global(.order-history-wrapper .order-price) {
                        font-weight: 600;
                        color: #1f2937;
                      }
                      
                      :global(.dark .order-history-wrapper .order-price) {
                        color: #e5e7eb;
                      }
                      
                      :global(.order-history-wrapper .view-details) {
                        color: #ef4444;
                        font-weight: 500;
                        text-decoration: none;
                        transition: all 0.2s ease;
                      }
                      
                      :global(.order-history-wrapper .view-details:hover) {
                        color: #dc2626;
                        text-decoration: underline;
                      }
                      
                      :global(.order-history-wrapper .empty-orders) {
                        text-align: center;
                        padding: 3rem 1rem;
                        color: #6b7280;
                      }
                      
                      :global(.dark .order-history-wrapper .empty-orders) {
                        color: #9ca3af;
                      }
                      
                      :global(.order-history-wrapper .empty-orders svg) {
                        margin: 0 auto 1rem;
                        color: #d1d5db;
                      }
                      
                      :global(.dark .order-history-wrapper .empty-orders svg) {
                        color: #4b5563;
                      }
                    `}</style>
                    <OrderHistory userId={user.uid} />
                  </div>
                </div>
              )}

              {activeTab === "addresses" && (
                <div className="animate-fadeIn">
                  <div className="flex items-center mb-6">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mis Direcciones</h2>
                      <p className="text-gray-500 dark:text-gray-400">Gestiona tus direcciones de envío</p>
                    </div>
                  </div>

                  {/* Estilizado para AddressList */}
                  <div className="address-list-wrapper">
                    <style jsx>{`
                      :global(.address-list-wrapper .address-card) {
                        background: linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0.5));
                        backdrop-filter: blur(8px);
                        border-radius: 12px;
                        padding: 1.5rem;
                        border: 1px solid rgba(229, 231, 235, 0.7);
                        transition: all 0.3s ease;
                        margin-bottom: 1rem;
                        position: relative;
                        overflow: hidden;
                      }
                      
                      :global(.dark .address-list-wrapper .address-card) {
                        background: linear-gradient(to bottom right, rgba(30,41,59,0.7), rgba(15,23,42,0.5));
                        border: 1px solid rgba(75, 85, 99, 0.3);
                      }
                      
                      :global(.address-list-wrapper .address-card:hover) {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                      }
                      
                      :global(.dark .address-list-wrapper .address-card:hover) {
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
                      }
                      
                      :global(.address-list-wrapper .address-type) {
                        position: absolute;
                        top: 0;
                        right: 0;
                        background: #ef4444;
                        color: white;
                        padding: 0.25rem 1rem;
                        font-size: 0.75rem;
                        font-weight: 500;
                        transform: rotate(45deg) translateX(30%) translateY(-50%);
                        width: 150px;
                        text-align: center;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                      }
                      
                      :global(.address-list-wrapper .address-name) {
                        font-weight: 600;
                        font-size: 1.125rem;
                        color: #1f2937;
                        margin-bottom: 0.5rem;
                      }
                      
                      :global(.dark .address-list-wrapper .address-name) {
                        color: #f3f4f6;
                      }
                      
                      :global(.address-list-wrapper .address-details) {
                        color: #4b5563;
                        margin-bottom: 1rem;
                        line-height: 1.5;
                      }
                      
                      :global(.dark .address-list-wrapper .address-details) {
                        color: #d1d5db;
                      }
                      
                      :global(.address-list-wrapper .address-actions) {
                        display: flex;
                        gap: 0.5rem;
                        margin-top: 1rem;
                      }
                      
                      :global(.address-list-wrapper .address-actions button) {
                        padding: 0.5rem 1rem;
                        border-radius: 8px;
                        font-weight: 500;
                        font-size: 0.875rem;
                        transition: all 0.2s ease;
                      }
                      
                      :global(.address-list-wrapper .edit-btn) {
                        background-color: rgba(239, 68, 68, 0.1);
                        color: #ef4444;
                      }
                      
                      :global(.address-list-wrapper .edit-btn:hover) {
                        background-color: rgba(239, 68, 68, 0.2);
                      }
                      
                      :global(.address-list-wrapper .delete-btn) {
                        background-color: rgba(239, 68, 68, 0.1);
                        color: #ef4444;
                      }
                      
                      :global(.address-list-wrapper .delete-btn:hover) {
                        background-color: rgba(239, 68, 68, 0.2);
                      }
                      
                      :global(.address-list-wrapper .add-address-btn) {
                        background: linear-gradient(to right, #ef4444, #dc2626);
                        color: white;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        font-weight: 500;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        margin-top: 1rem;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1);
                      }
                      
                      :global(.address-list-wrapper .add-address-btn:hover) {
                        transform: translateY(-1px);
                        box-shadow: 0 6px 10px -1px rgba(239, 68, 68, 0.25), 0 4px 6px -1px rgba(239, 68, 68, 0.15);
                      }
                      
                      :global(.address-list-wrapper .empty-addresses) {
                        text-align: center;
                        padding: 3rem 1rem;
                        color: #6b7280;
                      }
                      
                      :global(.dark .address-list-wrapper .empty-addresses) {
                        color: #9ca3af;
                      }
                    `}</style>
                    <AddressList userId={user.uid} />
                  </div>
                </div>
              )}

              {activeTab === "favorites" && (
                <div id="favorites" className="animate-fadeIn">
                  <div className="flex items-center mb-6">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4">
                      <Heart className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mis Favoritos</h2>
                      <p className="text-gray-500 dark:text-gray-400">Accede rápidamente a tus productos favoritos</p>
                    </div>
                  </div>

                  {/* Estilizado para FavoritesPreview */}
                  <div className="favorites-wrapper">
                    <style jsx>{`
                      :global(.favorites-wrapper .favorites-grid) {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                        gap: 1.5rem;
                      }
                      
                      :global(.favorites-wrapper .product-card) {
                        background: linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0.5));
                        backdrop-filter: blur(8px);
                        border-radius: 12px;
                        overflow: hidden;
                        transition: all 0.3s ease;
                        border: 1px solid rgba(229, 231, 235, 0.7);
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                      }
                      
                      :global(.dark .favorites-wrapper .product-card) {
                        background: linear-gradient(to bottom right, rgba(30,41,59,0.7), rgba(15,23,42,0.5));
                        border: 1px solid rgba(75, 85, 99, 0.3);
                      }
                      
                      :global(.favorites-wrapper .product-card:hover) {
                        transform: translateY(-4px);
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                      }
                      
                      :global(.dark .favorites-wrapper .product-card:hover) {
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
                      }
                      
                      :global(.favorites-wrapper .product-image) {
                        aspect-ratio: 1/1;
                        object-fit: cover;
                        width: 100%;
                        border-top-left-radius: 12px;
                        border-top-right-radius: 12px;
                      }
                      
                      :global(.favorites-wrapper .product-info) {
                        padding: 1rem;
                        flex-grow: 1;
                        display: flex;
                        flex-direction: column;
                      }
                      
                      :global(.favorites-wrapper .product-name) {
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 0.5rem;
                        font-size: 1rem;
                        line-height: 1.5;
                      }
                      
                      :global(.dark .favorites-wrapper .product-name) {
                        color: #f3f4f6;
                      }
                      
                      :global(.favorites-wrapper .product-price) {
                        font-weight: 700;
                        color: #ef4444;
                        font-size: 1.125rem;
                        margin-top: auto;
                      }
                      
                      :global(.favorites-wrapper .product-actions) {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 1rem;
                        padding-top: 1rem;
                        border-top: 1px solid #e5e7eb;
                      }
                      
                      :global(.dark .favorites-wrapper .product-actions) {
                        border-top: 1px solid #374151;
                      }
                      
                      :global(.favorites-wrapper .add-to-cart) {
                        background: linear-gradient(to right, #ef4444, #dc2626);
                        color: white;
                        padding: 0.5rem 1rem;
                        border-radius: 8px;
                        font-weight: 500;
                        font-size: 0.875rem;
                        transition: all 0.2s ease;
                      }
                      
                      :global(.favorites-wrapper .add-to-cart:hover) {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);
                      }
                      
                      :global(.favorites-wrapper .remove-favorite) {
                        color: #6b7280;
                        transition: all 0.2s ease;
                      }
                      
                      :global(.favorites-wrapper .remove-favorite:hover) {
                        color: #ef4444;
                      }
                      
                      :global(.favorites-wrapper .empty-favorites) {
                        text-align: center;
                        padding: 3rem 1rem;
                        color: #6b7280;
                      }
                      
                      :global(.dark .favorites-wrapper .empty-favorites) {
                        color: #9ca3af;
                      }
                      
                      :global(.favorites-wrapper .view-all-btn) {
                        background: linear-gradient(to right, #ef4444, #dc2626);
                        color: white;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        font-weight: 500;
                        display: block;
                        width: 100%;
                        text-align: center;
                        margin-top: 1.5rem;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1);
                      }
                      
                      :global(.favorites-wrapper .view-all-btn:hover) {
                        transform: translateY(-1px);
                        box-shadow: 0 6px 10px -1px rgba(239, 68, 68, 0.25), 0 4px 6px -1px rgba(239, 68, 68, 0.15);
                      }
                    `}</style>
                    <div className="favorites-grid">
                      <FavoritesPreview />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-all duration-200"
                      onClick={() => router.push("/favorites")}
                    >
                      Ver todos mis favoritos
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
