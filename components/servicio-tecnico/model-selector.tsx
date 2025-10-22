"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import type { ServiceModel } from "@/models/TechnicalService"

interface ModelSelectorProps {
  models: ServiceModel[]
  selectedModel: string | null
  onSelectModel: (modelId: string) => void
}

export function ModelSelector({ models, selectedModel, onSelectModel }: ModelSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredModels = models.filter((model) => model.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Selecciona el modelo de tu dispositivo</h2>
        <p className="text-gray-600">Elige el modelo específico para una cotización más precisa</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar modelo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => (
          <Button
            key={model.id}
            variant={selectedModel === model.id ? "default" : "outline"}
            className={`h-16 flex items-center justify-center ${
              selectedModel === model.id ? "bg-red-600 hover:bg-red-700" : "hover:bg-gray-50"
            }`}
            onClick={() => onSelectModel(model.id)}
          >
            <span className="font-medium">{model.name}</span>
          </Button>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron modelos que coincidan con tu búsqueda</p>
        </div>
      )}
    </div>
  )
}
