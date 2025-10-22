"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Wrench } from "lucide-react"
import ServicioTecForm from "@/components/serviciotec/ServicioTecForm"
import ServicioTecHistorial from "@/components/serviciotec/ServicioTecHistorial"

export default function ServicioTecPage() {
  const [activeTab, setActiveTab] = useState("nuevo")

  return (
    <div className="space-y-6">
      {/* Header con icono de herramienta */}
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg">
          <Wrench className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-green-800 dark:text-green-200">Servicio Técnico</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-center">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="nuevo" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Nuevo Servicio
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Historial de Servicios
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="nuevo" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="lg:col-span-1">
              <ServicioTecForm />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historial" className="space-y-6">
          <ServicioTecHistorial />
        </TabsContent>
      </Tabs>
    </div>
  )
}
