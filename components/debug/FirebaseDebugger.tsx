"use client"

import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, enableNetwork, disableNetwork } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FirebaseDebugger() {
  const [collections, setCollections] = useState<string[]>([])
  const [collectionData, setCollectionData] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">("online")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const fetchCollections = async () => {
    try {
      setLoading(true)
      setError(null)

      // Lista de colecciones que queremos verificar
      const collectionsToCheck = ["stock", "stockCategories"]

      setCollections(collectionsToCheck)

      // Obtener datos de cada colección
      const data: Record<string, any[]> = {}

      for (const collName of collectionsToCheck) {
        try {
          const collRef = collection(db, collName)
          const snapshot = await getDocs(collRef)

          data[collName] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        } catch (err) {
          console.error(`Error fetching collection ${collName}:`, err)
          data[collName] = []
        }
      }

      setCollectionData(data)
    } catch (err) {
      console.error("Error in fetchCollections:", err)
      setError("Error al obtener datos de Firebase")
    } finally {
      setLoading(false)
    }
  }

  const toggleNetwork = async () => {
    try {
      if (networkStatus === "online") {
        await disableNetwork(db)
        setNetworkStatus("offline")
        setStatusMessage("Red desactivada. La app está usando datos en caché.")
      } else {
        await enableNetwork(db)
        setNetworkStatus("online")
        setStatusMessage("Red activada. La app está conectada a Firestore.")
      }

      setTimeout(() => setStatusMessage(null), 3000)
    } catch (error) {
      console.error("Error toggling network:", error)
      setError("Error al cambiar el estado de la red")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Firebase Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button onClick={fetchCollections} disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading ? "Cargando..." : "Verificar conexión a Firebase"}
          </Button>

          <Button
            onClick={toggleNetwork}
            variant={networkStatus === "online" ? "outline" : "default"}
            className={
              networkStatus === "online" ? "border-red-200 text-red-600 hover:bg-red-50" : "bg-red-600 hover:bg-red-700"
            }
          >
            {networkStatus === "online" ? "Simular modo offline" : "Volver a modo online"}
          </Button>
        </div>

        {statusMessage && <div className="p-4 mb-4 bg-green-100 text-green-700 rounded-md">{statusMessage}</div>}

        {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <div className="p-4 mb-4 bg-blue-50 text-blue-700 rounded-md">
          <h3 className="font-medium mb-2">Estado actual:</h3>
          <p>
            Modo:{" "}
            <strong>
              {networkStatus === "online" ? "Online (conectado a Firestore)" : "Offline (usando caché local)"}
            </strong>
          </p>
          <p className="text-sm mt-2">
            Puedes probar el funcionamiento del caché de Firestore activando el modo offline y navegando por la
            aplicación. Los datos seguirán disponibles gracias al caché nativo de Firestore.
          </p>
        </div>

        {collections.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            {collections.map((collName) => (
              <AccordionItem key={collName} value={collName}>
                <AccordionTrigger>
                  {collName} ({collectionData[collName]?.length || 0} documentos)
                </AccordionTrigger>
                <AccordionContent>
                  {collectionData[collName]?.length > 0 ? (
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs">
                      {JSON.stringify(collectionData[collName], null, 2)}
                    </pre>
                  ) : (
                    <p className="text-gray-500">No hay documentos en esta colección</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
