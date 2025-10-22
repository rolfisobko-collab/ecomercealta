"use client"
import { Badge } from "@/components/ui/badge"

export default function ServicioTecStats() {
  // Datos de ejemplo - en producción vendrían de la API
  const stats = {
    serviciosHoy: 8,
    serviciosPendientes: 15,
    serviciosListos: 3,
    ingresosMes: 45000,
  }

  const serviciosRecientes = [
    {
      id: "ST001",
      cliente: "Juan Pérez",
      dispositivo: "iPhone 13",
      estado: "diagnosticando",
      fecha: "2024-01-07",
    },
    {
      id: "ST002",
      cliente: "María García",
      dispositivo: "Galaxy S21",
      estado: "listo",
      fecha: "2024-01-06",
    },
    {
      id: "ST003",
      cliente: "Carlos López",
      dispositivo: "Xiaomi Mi 11",
      estado: "reparando",
      fecha: "2024-01-06",
    },
  ]

  const getEstadoBadge = (estado: string) => {
    const estados = {
      recibido: { label: "Recibido", color: "bg-blue-100 text-blue-800" },
      diagnosticando: { label: "Diagnosticando", color: "bg-yellow-100 text-yellow-800" },
      reparando: { label: "Reparando", color: "bg-purple-100 text-purple-800" },
      listo: { label: "Listo", color: "bg-green-100 text-green-800" },
      entregado: { label: "Entregado", color: "bg-gray-100 text-gray-800" },
    }
    const estadoInfo = estados[estado as keyof typeof estados] || estados.recibido
    return (
      <Badge variant="secondary" className={estadoInfo.color}>
        {estadoInfo.label}
      </Badge>
    )
  }

  return null
}
