"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AccessDeniedPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<{ name: string; role: string } | null>(null)
  const [currentPath, setCurrentPath] = useState<string>("")

  useEffect(() => {
    // Obtener información del usuario
    try {
      const adminData = localStorage.getItem("adminData")
      if (adminData) {
        const userData = JSON.parse(adminData)
        setUserInfo({
          name: userData.name || "Usuario",
          role: userData.role || "usuario",
        })
      }
    } catch (e) {
      console.error("Error accessing localStorage:", e)
    }

    // Registrar la ruta a la que intentó acceder
    setCurrentPath(window.location.pathname)

    // Simular envío de notificación al administrador
    console.log("Intento de acceso no autorizado registrado")
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Acceso Denegado</h1>
        </div>

        <div className="space-y-4 text-center">
          <p className="text-gray-700">No tienes permisos para acceder a esta sección.</p>

          <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Advertencia:</strong> Este intento de acceso no autorizado ha sido registrado y el administrador
              será notificado.
            </p>
          </div>

          {userInfo && (
            <div className="text-sm text-gray-500">
              Usuario: {userInfo.name} ({userInfo.role})
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button onClick={() => router.push("/admin/products")} className="w-full flex items-center justify-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Trabajo
          </Button>
        </div>
      </div>
    </div>
  )
}
