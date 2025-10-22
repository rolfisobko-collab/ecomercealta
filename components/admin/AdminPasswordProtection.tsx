"use client"

import React, { useState, useEffect } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ADMIN_PASSWORD = "charly1234*"

export function AdminPasswordProtection({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password === ADMIN_PASSWORD) {
      setIsUnlocked(true)
      setError("")
    } else {
      setError("Contraseña incorrecta")
      setPassword("")
    }
  }

  if (isUnlocked) {
    return <>{children}</>
  }

  return (
    <div className="relative min-h-screen">
      {/* Contenido con blur */}
      <div className="blur-lg pointer-events-none select-none">
        {children}
      </div>

      {/* Modal de contraseña */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
              <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Área Protegida
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Ingresa la contraseña para acceder al panel de administración
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError("")
                }}
                className="w-full text-center text-lg tracking-wider"
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-2 text-center font-medium">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-6 text-lg"
            >
              Desbloquear
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Solo personal autorizado puede acceder
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
