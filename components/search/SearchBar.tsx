"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"

interface SearchBarProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
}

export default function SearchBar({ placeholder = "Buscar productos...", className = "", onSearch }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (query.trim()) {
      if (onSearch) {
        onSearch(query)
      } else {
        startTransition(() => {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        })
      }
    }
  }

  return (
    <form onSubmit={handleSearch} className={`relative flex w-full max-w-sm ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>
      <Button type="submit" className="ml-2 bg-red-600 hover:bg-red-700" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
      </Button>
    </form>
  )
}
