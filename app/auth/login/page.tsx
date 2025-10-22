"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Mail, User, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { PasswordInput } from "@/components/auth/password-input"
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons"
import { motion } from "framer-motion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authService, type AuthError, type RegisterData } from "@/services/auth/authService"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") || "/"
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register form state
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await authService.loginWithEmail(loginEmail, loginPassword)
      router.push(redirectUrl)
    } catch (error) {
      const authError = error as AuthError
      setError(authError.message)
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (registerPassword !== registerConfirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    try {
      const userData: RegisterData = {
        email: registerEmail,
        password: registerPassword,
        name: registerName,
      }

      await authService.registerUser(userData)
      router.push(redirectUrl)
    } catch (error) {
      const authError = error as AuthError
      setError(authError.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Auth forms */}
      <div className="flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md bg-white/50 backdrop-blur-sm rounded-xl shadow-lg">
          <div className="w-full max-h-[80vh] overflow-y-auto p-6 md:p-8">
            <h2 className="text-2xl font-bold text-center mb-8 sticky top-0 bg-white/80 backdrop-blur-sm pt-2 pb-4 z-10 rounded-lg">
              {showLoginForm ? "Iniciar Sesión" : "Crear una cuenta"}
            </h2>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showLoginForm ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10 h-12 text-base"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-base">
                        Contraseña
                      </Label>
                      <Link href="/auth/forgot-password" className="text-sm font-medium text-red-600 hover:underline">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <PasswordInput
                      id="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">
                      Nombre completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Juan Pérez"
                        className="pl-10 h-12 text-base"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-base">
                      Correo electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10 h-12 text-base"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-base">
                      Contraseña
                    </Label>
                    <PasswordInput
                      id="register-password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-base">
                      Confirmar contraseña
                    </Label>
                    <PasswordInput
                      id="confirm-password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Registrando..." : "Crear cuenta"}
                    {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </form>
              </motion.div>
            )}

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-gray-500 rounded-full">O continúa con</span>
              </div>
            </div>

            <AuthSocialButtons />

            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                {showLoginForm ? "¿No tienes una cuenta? " : "¿Ya tienes una cuenta? "}
                <button
                  onClick={() => {
                    setShowLoginForm(!showLoginForm)
                    setError(null)
                  }}
                  className="text-red-600 font-medium hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  {showLoginForm ? "Regístrate aquí" : "Inicia sesión aquí"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Aurora Borealis Effect */}
      <div className="hidden lg:block relative overflow-hidden bg-black">
        {/* Base layer - dark background */}
        <div className="absolute inset-0 bg-black"></div>

        {/* Aurora borealis effect layers */}
        <div className="absolute inset-0">
          {/* Multiple aurora waves */}
          <div className="aurora-wave aurora-1"></div>
          <div className="aurora-wave aurora-2"></div>
          <div className="aurora-wave aurora-3"></div>
          <div className="aurora-wave aurora-4"></div>
          <div className="aurora-wave aurora-5"></div>

          {/* Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-64 h-64 relative z-10"
              style={{ filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))" }}
            >
              <Image src="/images/logo-blanco-color.png" alt="Logo" fill className="object-contain" priority />
            </div>
          </div>
        </div>

        {/* Aurora animation styles */}
        <style jsx global>{`
          .aurora-wave {
            position: absolute;
            width: 200%;
            height: 200%;
            top: -50%;
            left: -50%;
            background: transparent;
            opacity: 0.3;
            border-radius: 40%;
            filter: blur(60px);
          }

          .aurora-1 {
            background: linear-gradient(90deg, rgba(20, 20, 20, 0.8) 0%, rgba(30, 30, 30, 0.3) 50%, rgba(20, 20, 20, 0.8) 100%);
            animation: aurora-movement 20s infinite linear, aurora-opacity 8s infinite ease-in-out;
          }

          .aurora-2 {
            background: linear-gradient(90deg, rgba(25, 25, 25, 0.8) 0%, rgba(35, 35, 35, 0.3) 50%, rgba(25, 25, 25, 0.8) 100%);
            animation: aurora-movement 15s infinite linear reverse, aurora-opacity 10s 1s infinite ease-in-out;
          }

          .aurora-3 {
            background: linear-gradient(90deg, rgba(15, 15, 15, 0.8) 0%, rgba(30, 30, 30, 0.4) 50%, rgba(15, 15, 15, 0.8) 100%);
            animation: aurora-movement 25s infinite linear, aurora-opacity 12s 2s infinite ease-in-out;
          }

          .aurora-4 {
            background: linear-gradient(90deg, rgba(20, 20, 22, 0.8) 0%, rgba(32, 32, 34, 0.3) 50%, rgba(20, 20, 22, 0.8) 100%);
            animation: aurora-movement 18s infinite linear reverse, aurora-opacity 9s 1.5s infinite ease-in-out;
          }

          .aurora-5 {
            background: linear-gradient(90deg, rgba(22, 22, 24, 0.8) 0%, rgba(38, 38, 40, 0.3) 50%, rgba(22, 22, 24, 0.8) 100%);
            animation: aurora-movement 22s infinite linear, aurora-opacity 11s 0.5s infinite ease-in-out;
          }

          @keyframes aurora-movement {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes aurora-opacity {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </div>
  )
}
