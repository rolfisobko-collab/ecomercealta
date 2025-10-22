"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ShoppingCart, User, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function SiteHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Main Navigation */}
      <div className="container flex h-16 items-center">
        <div className="flex-shrink-0 mr-auto ml-4">
          <Link href="/" className="block">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Alta-negro-Photoroom-2-VWXcnw60P64byJRzm8JVx4zpZPZm2j.png"
              alt="Alta Telefonía"
              className="h-12 w-auto"
            />
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          {/* Gremio quick access (mobile icon) */}
          <Button variant="ghost" size="icon" className="sm:hidden" asChild>
            <Link href="/gremio" aria-label="Ir a Gremio">
              <Wrench className="h-5 w-5" />
            </Link>
          </Button>
          {/* Gremio quick access */}
          <Button asChild className="hidden sm:inline-flex rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-sm">
            <Link href="/gremio">
              <Wrench className="h-4 w-4 mr-2" />
              Gremio
            </Link>
          </Button>
          {isSearchOpen ? (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar..."
                className="w-full pl-8 pr-4"
                autoFocus
                onBlur={() => setIsSearchOpen(false)}
              />
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/account">
              <User className="h-5 w-5" />
              <span className="sr-only">Cuenta</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600">
                3
              </Badge>
              <span className="sr-only">Carrito</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
