"use client"

import { useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Permisos por defecto para usuarios que no los tengan
const DEFAULT_PERMISSIONS = {
  dashboard: true,
  ventas: true,
  caja: true,
  deposito: true,
  balances: true,
  serviciotec: true,
  registros: true,
  deudas: true,
  products: true,
  categories: true,
  suppliers: true,
  purchases: true,
  orders: true,
  users: true,
}

export default function AdminLoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const error = params.get('error') === '1'
  const returnTo = useMemo(() => {
    const r = params.get('returnTo')
    // solo permitir rutas internas bajo /admin
    return r && r.startsWith('/admin') ? r : '/admin'
  }, [params])

  // Si ya existe una sesión válida del lado del servidor (cookie JWT),
  // completar localStorage y redirigir automáticamente para evitar el loop.
  useEffect(() => {
    let cancelled = false
    const bootstrapFromServerSession = async () => {
      try {
        if (error) return
        const res = await fetch('/api/auth/check-admin-session', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        localStorage.setItem("isAdmin", "true")
        localStorage.setItem(
          "adminData",
          JSON.stringify({
            name: data.name || "Administrador",
            role: data.role || "admin",
            email: data.email || "admin@example.com",
            permissions: data.permissions || { all: true },
          })
        )
        router.push(returnTo)
      } catch (_) {
        // ignorar, el usuario puede loguearse con el formulario
      }
    }
    bootstrapFromServerSession()
    return () => {
      cancelled = true
    }
  }, [error, returnTo, router])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Fondo animado */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black animate-gradient-x"></div>

      {/* Formas flotantes */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-red-500 opacity-20 mix-blend-multiply blur-xl animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-gray-400 opacity-20 mix-blend-multiply blur-xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/3 h-96 w-96 rounded-full bg-red-400 opacity-20 mix-blend-multiply blur-xl animate-blob animation-delay-4000"></div>

      {/* Partículas de fondo */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-1/6 left-1/6 h-2 w-2 rounded-full bg-white animate-pulse"></div>
        <div className="absolute top-1/3 left-1/2 h-3 w-3 rounded-full bg-white animate-pulse animation-delay-2000"></div>
        <div className="absolute top-2/3 left-1/4 h-2 w-2 rounded-full bg-white animate-pulse animation-delay-3000"></div>
        <div className="absolute top-1/4 right-1/4 h-2 w-2 rounded-full bg-white animate-pulse animation-delay-4000"></div>
        <div className="absolute bottom-1/3 right-1/3 h-3 w-3 rounded-full bg-white animate-pulse animation-delay-5000"></div>
      </div>

      {/* Anillos decorativos */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[500px] w-[500px] rounded-full border border-white/10 animate-spin-slow"></div>
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 animate-spin-reverse"></div>
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 animate-spin-slow"></div>
      </div>

      {/* Tarjeta de login con efecto de vidrio */}
      <Card className="relative z-10 w-full max-w-md border-none bg-white/80 backdrop-blur-md dark:bg-gray-900/80 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Alta-negro-Photoroom-2-VWXcnw60P64byJRzm8JVx4zpZPZm2j.png"
              alt="Alta Telefonía"
              className="h-16 drop-shadow-md"
            />
          </div>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent font-bold">
            Panel de Administración
          </CardTitle>
          <CardDescription className="text-center">Acceso para usuarios internos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Usuario o contraseña incorrectos</AlertDescription>
            </Alert>
          )}

          <form action="/api/auth/admin-login" method="GET" className="space-y-4">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Usuario
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Ingresá el usuario"
                required
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Ingresá la clave"
                required
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-medium py-2.5 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Ingresar
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            Solo para personal autorizado de Alta Telefonía
          </div>
        </CardFooter>
      </Card>

      <style jsx>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        .animate-gradient-x {
          animation: gradient-x 15s ease infinite;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-3000 {
          animation-delay: 3s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animation-delay-5000 {
          animation-delay: 5s;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }
      `}</style>
    </div>
  )
}
