"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Clock, DollarSign } from "lucide-react"
import type { TechnicalService } from "@/models/TechnicalService"

interface IssueSelectorProps {
  services: TechnicalService[]
  selectedIssue: string | null
  onSelectIssue: (issueId: string) => void
}

export function IssueSelector({ services, selectedIssue, onSelectIssue }: IssueSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
    }
    return `${mins}m`
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">¿Qué problema tiene tu dispositivo?</h2>
        <p className="text-gray-600">Selecciona el servicio que necesitas</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar servicio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedIssue === service.id
                ? "border-red-500 bg-red-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => onSelectIssue(service.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{service.name}</h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {service.category}
              </Badge>
            </div>

            {service.description && <p className="text-gray-600 text-sm mb-3">{service.description}</p>}

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(service.estimatedTime)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-green-600 font-semibold">
                <DollarSign className="h-4 w-4" />
                <span>${service.basePrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron servicios que coincidan con tu búsqueda</p>
        </div>
      )}
    </div>
  )
}
