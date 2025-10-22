"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Truck, ArrowRight, Navigation, ArrowLeft, Search, Store, Home } from "lucide-react"
import { formatCurrency } from "@/utils/formatCurrency"
import { MapIframe } from "./map-iframe"

interface LogisticsSelectorProps {
  onSelectLogistics: (type: string, price: number) => void
  onBack: () => void
}

interface StoreType {
  id: string
  name: string
  address: string
  location: [number, number] // [lat, lng]
  phone: string
  hours: string
}

export function LogisticsSelectorSimple({ onSelectLogistics, onBack }: LogisticsSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [userAddress, setUserAddress] = useState("")
  const [distance, setDistance] = useState<number | null>(5.2) // Valor predeterminado para demostración
  const [shippingCost, setShippingCost] = useState<number>(2000) // Valor predeterminado para demostración
  const [addressInput, setAddressInput] = useState("")
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null)
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)

  // Lista de sucursales
  const stores: StoreType[] = [
    {
      id: "main",
      name: "Tienda Principal",
      address: "Catamarca 1928, Posadas, Misiones",
      location: [-27.36714, -55.89344],
      phone: "+54 376 123-4567",
      hours: "Lunes a Viernes: 9:00 - 18:00, Sábados: 9:00 - 13:00",
    },
    {
      id: "branch1",
      name: "Sucursal Centro",
      address: "Bolívar 2145, Posadas, Misiones",
      location: [-27.37214, -55.89744],
      phone: "+54 376 765-4321",
      hours: "Lunes a Viernes: 9:00 - 18:00",
    },
    {
      id: "branch2",
      name: "Sucursal Shopping",
      address: "Av. Quaranta 3500, Posadas, Misiones",
      location: [-27.38714, -55.91344],
      phone: "+54 376 555-1234",
      hours: "Todos los días: 10:00 - 22:00",
    },
  ]

  // Función para buscar dirección
  const handleAddressSearch = () => {
    if (!addressInput.trim()) return

    setIsCalculatingDistance(true)

    // Simulamos la búsqueda de dirección
    setTimeout(() => {
      setUserAddress(addressInput)

      // Calculamos una distancia aleatoria entre 1 y 10 km
      const randomDistance = Math.random() * 9 + 1
      setDistance(randomDistance)

      // Calculamos el costo de envío
      const cost = calculateShippingCost(randomDistance)
      setShippingCost(cost)

      setIsCalculatingDistance(false)
    }, 1000)
  }

  // Función para calcular el costo de envío basado en la distancia
  const calculateShippingCost = (distanceKm: number): number => {
    // Base de 1500 para los primeros 5km
    if (distanceKm <= 5) return 1500

    // 300 adicionales por cada km después de los primeros 5km
    const additionalKm = Math.ceil(distanceKm - 5)
    return 1500 + additionalKm * 300
  }

  // Función para continuar con la selección
  const handleContinue = () => {
    if (selected) {
      if (selected === "pickup" && distance !== null) {
        onSelectLogistics(selected, shippingCost)
      } else {
        onSelectLogistics(selected, 0) // Si es "store", el precio es 0
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Coordinar logística</h2>
        <p className="opacity-90">Elige cómo quieres gestionar la entrega y recogida de tu dispositivo</p>
      </div>

      <div className="p-6">
        {/* Mapa interactivo */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-red-500" />
              Nuestras sucursales
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserAddress("Tu ubicación actual")
                setAddressInput("Tu ubicación actual")

                // Seleccionamos la tienda principal por defecto
                setSelectedStore(stores[0])

                // Establecemos una distancia fija para demostración
                setDistance(3.2)
                setShippingCost(1500)
              }}
              className="flex items-center gap-1"
            >
              <Navigation className="h-4 w-4" />
              Mi ubicación
            </Button>
          </div>

          {/* Buscador de direcciones */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Ingresa tu dirección"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button onClick={handleAddressSearch} disabled={isCalculatingDistance || !addressInput.trim()}>
              Buscar
            </Button>
          </div>

          {/* Contenedor del mapa */}
          <MapIframe className="shadow-inner" />

          {/* Información de ubicación del usuario */}
          {userAddress && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="flex items-start">
                <Home className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-300">Tu ubicación</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{userAddress}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Opciones de logística */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Truck className="h-5 w-5 mr-2 text-red-500" />
            Opciones de entrega
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opción: Traer a la tienda */}
            <div
              className={`border rounded-lg p-5 cursor-pointer transition-all ${
                selected === "store"
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700"
              }`}
              onClick={() => {
                setSelected("store")
                setSelectedStore(stores[0]) // Seleccionamos la tienda principal por defecto
              }}
            >
              <div className="flex items-center mb-3">
                <div
                  className={`p-2 rounded-full ${selected === "store" ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                >
                  <Store className="h-5 w-5" />
                </div>
                <h3 className="font-bold ml-3">Traer a la tienda</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Trae tu dispositivo a nuestra tienda y lo repararemos lo antes posible.
              </p>

              {selectedStore && selected === "store" && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-red-500 mt-1 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{selectedStore.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStore.address}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedStore.hours}</p>
                      <p className="text-sm font-medium text-red-600 mt-1">{selectedStore.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Opción: Servicio a domicilio */}
            <div
              className={`border rounded-lg p-5 cursor-pointer transition-all ${
                selected === "pickup"
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700"
              }`}
              onClick={() => {
                setSelected("pickup")
                if (!selectedStore) {
                  setSelectedStore(stores[0]) // Seleccionamos la tienda principal por defecto
                }
              }}
            >
              <div className="flex items-center mb-3">
                <div
                  className={`p-2 rounded-full ${selected === "pickup" ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                >
                  <Truck className="h-5 w-5" />
                </div>
                <h3 className="font-bold ml-3">Servicio a domicilio</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Pasamos a buscar tu dispositivo, lo reparamos y te lo devolvemos.
              </p>

              {userAddress && selected === "pickup" && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {selectedStore ? (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Distancia:</span>
                        <span className="font-medium">{distance?.toFixed(1)} km</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Costo de envío:</span>
                        <span className="font-bold text-red-600">{formatCurrency(shippingCost)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Por favor, selecciona una sucursal en el mapa
                    </p>
                  )}
                </div>
              )}

              {!userAddress && selected === "pickup" && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Por favor, indica tu ubicación en el mapa
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={onBack} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <Button
            onClick={handleContinue}
            disabled={
              !selected ||
              (selected === "store" && !selectedStore) ||
              (selected === "pickup" && (!userAddress || !selectedStore))
            }
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 flex items-center"
          >
            Continuar <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
