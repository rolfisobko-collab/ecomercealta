"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MovementForm } from "@/components/movements/MovementForm"
import { MovementList } from "@/components/movements/MovementList"

export default function MovementsPage() {
  const [activeTab, setActiveTab] = useState("list")

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Gestión de Compras e Inventario</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Historial de Movimientos</TabsTrigger>
          <TabsTrigger value="new">Registrar Compra/Movimiento</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-6">
          <MovementList />
        </TabsContent>
        <TabsContent value="new" className="mt-6">
          <MovementForm onSuccess={() => setActiveTab("list")} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
