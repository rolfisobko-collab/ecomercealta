"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PasswordInput } from "@/components/auth/password-input"
import { AlertCircle } from "lucide-react"
import { authenticateInternalUser } from "@/services/auth/internalUserService"

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
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      console.log("Intentando autenticar usuario:", username)

      // Autenticar usando el servicio de usuarios internos
      const user = await authenticateInternalUser(username, password)
      console.log("Usuario autenticado:", user)

      if (user) {
        // Preparar datos del usuario con permisos por defecto
        const userData = {
          id: user.id,
          name: user.name || "Usuario",
          role: user.role || "user",
          email: user.email || "",
          permissions: user.permissions || DEFAULT_PERMISSIONS,
        }

        console.log("Guardando datos del usuario:", userData)

        // Guardar en localStorage
        localStorage.setItem("isAdmin", "true")
        localStorage.setItem("adminData", JSON.stringify(userData))

        // Crear sesión en el servidor también
        try {
          const sessionResponse = await fetch("/api/auth/create-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          })

          if (sessionResponse.ok) {
            console.log("Sesión creada en el servidor")
          } else {
            console.warn("No se pudo crear la sesión en el servidor, pero continuando con localStorage")
          }
        } catch (sessionError) {
          console.warn("Error creando sesión en servidor:", sessionError)
        }

        console.log("Redirigiendo a /admin")
        // Redirigir al panel de administración
        router.push("/admin")
      } else {
        setError("Credenciales incorrectas. Verifica tu usuario y contraseña.")
      }
    } catch (error: any) {
      console.error("Error de autenticación:", error)
      setError(error.message || "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Usuario
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  placeholder="Nombre de usuario o email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-red-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <PasswordInput
                id="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-medium py-2.5 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                "Iniciar Sesión"
              )}
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
