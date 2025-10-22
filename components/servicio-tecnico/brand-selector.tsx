"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import type { ServiceBrand } from "@/models/TechnicalService"

interface BrandSelectorProps {
  brands: ServiceBrand[]
  selectedBrand: string | null
  onSelectBrand: (brandId: string) => void
}

export function BrandSelector({ brands, selectedBrand, onSelectBrand }: BrandSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredBrands = brands.filter((brand) => brand.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Selecciona la marca de tu dispositivo</h2>
        <p className="text-gray-600">Elige la marca para continuar con la cotización</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBrands.map((brand) => (
          <Button
            key={brand.id}
            variant={selectedBrand === brand.id ? "default" : "outline"}
            className={`h-20 flex flex-col items-center justify-center space-y-2 ${
              selectedBrand === brand.id ? "bg-red-600 hover:bg-red-700" : "hover:bg-gray-50"
            }`}
            onClick={() => onSelectBrand(brand.id)}
          >
            {brand.logoUrl && (
              <img src={brand.logoUrl || "/placeholder.svg"} alt={brand.name} className="h-8 w-8 object-contain" />
            )}
            <span className="text-sm font-medium">{brand.name}</span>
          </Button>
        ))}
      </div>

      {filteredBrands.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron marcas que coincidan con tu búsqueda</p>
        </div>
      )}
    </div>
  )
}
