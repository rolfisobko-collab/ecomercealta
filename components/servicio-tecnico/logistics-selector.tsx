"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Truck, ArrowRight, Navigation, ArrowLeft, Search, Store, Home, BookUser } from "lucide-react"
import { formatCurrency } from "@/utils/formatCurrency"
import { MapFallback } from "./map-fallback"
import mapboxgl from "mapbox-gl"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import AddressList from "@/components/profile/AddressList"

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

export function LogisticsSelector({ onSelectLogistics, onBack }: LogisticsSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userAddress, setUserAddress] = useState("")
  const [distance, setDistance] = useState<number | null>(null)
  const [shippingCost, setShippingCost] = useState<number>(1500)
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
  const [addressInput, setAddressInput] = useState("")
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null)
  const [addressSuggestions, setAddressSuggestions] = useState<
    Array<{
      place_name: string
      center: [number, number]
    }>
  >([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<{
    place_name: string
    center: [number, number]
  } | null>(null)
  const [userMarker, setUserMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [showRoute, setShowRoute] = useState(false)
  const [routeInfo, setRouteInfo] = useState<{
    duration: number | null
    distance: number | null
  }>({ duration: null, distance: null })

  // Saved addresses (same as checkout/profile)
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Array<{ id: string; label: string; full: string }>>([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [manageDialogOpen, setManageDialogOpen] = useState(false)

  // Lista de sucursales
  const stores: StoreType[] = [
    {
      id: "main",
      name: "Altatelefonia",
      address: "Catamarca 1928, N3300 Posadas, Misiones",
      location: [-27.370536, -55.895494], // [lat, lng] para Leaflet
      phone: "+54 376 123-4567",
      hours: "Lunes a Viernes: 9:00 - 18:00, Sábados: 9:00 - 13:00",
    },
  ]

  // Seleccionar automáticamente la única sucursal disponible
  useEffect(() => {
    if (stores.length === 1 && !selectedStore) {
      setSelectedStore(stores[0])
    }
  }, [])

  // Geocode a free-form address string to coordinates using Mapbox
  const geocodeAddress = async (address: string) => {
    try {
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}&country=ar&limit=1&language=es`
      )
      const data = await resp.json()
      const feature = data?.features?.[0]
      if (feature?.center) {
        handleSelectSuggestion({ place_name: feature.place_name, center: feature.center })
      }
    } catch (e) {
      console.error("Error geocoding address", e)
    }
  }

  // Load saved addresses for the logged in user
  useEffect(() => {
    const loadAddresses = async () => {
      if (!user) return
      setAddressesLoading(true)
      try {
        const addressesRef = collection(db, "addresses")
        const qy = query(addressesRef, where("userId", "==", user.uid))
        const qs = await getDocs(qy)
        const arr: Array<{ id: string; label: string; full: string }> = []
        qs.forEach((doc) => {
          const d: any = doc.data()
          const full = `${d.street || ""} ${d.number || ""}${d.floor ? ", Piso " + d.floor : ""}${d.apartment ? ", Depto " + d.apartment : ""}, ${d.municipality || ""}, ${d.province || ""}, ${d.postalCode || ""}, ${d.country || "Argentina"}`.replace(/\s+,/g, ",").replace(/\s+/g, " ").trim()
          arr.push({ id: doc.id, label: d.name || full, full })
        })
        setAddresses(arr)
      } finally {
        setAddressesLoading(false)
      }
    }
    loadAddresses()
  }, [user])

  // Añadir como un nuevo useEffect debajo de la selección automática de la tienda
  useEffect(() => {
    const handleRouteCalculated = (event: any) => {
      const { duration, distance } = event.detail
      setRouteInfo({
        duration,
        distance,
      })
      // Calcular costo de envío basado en la distancia (metros a km)
      const distanceKm = distance / 1000
      const cost = calculateShippingCost(distanceKm)
      setDistance(distanceKm)
      setShippingCost(cost)
    }

    window.addEventListener("routeCalculated", handleRouteCalculated)

    return () => {
      window.removeEventListener("routeCalculated", handleRouteCalculated)
    }
  }, [])

  // Función para obtener la ubicación del usuario
  const handleGetUserLocation = () => {
    setIsCalculatingDistance(true)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(userLoc)
          setUserMarker(userLoc)
          setShowRoute(true)

          // Si hay una tienda seleccionada, calcular distancia
          if (selectedStore) {
            calculateDistance(userLoc.lat, userLoc.lng, selectedStore.location[0], selectedStore.location[1])
          }

          setIsCalculatingDistance(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          alert("No pudimos acceder a tu ubicación. Por favor, habilita el acceso a la ubicación en tu navegador.")
          setIsCalculatingDistance(false)
        },
      )
    } else {
      alert("Tu navegador no soporta geolocalización.")
      setIsCalculatingDistance(false)
    }
  }

  // Función para buscar direcciones y mostrar sugerencias
  const handleAddressInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAddressInput(value)

    if (value.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      // Usar la API de Geocoding de Mapbox para obtener sugerencias
      // Limitamos la búsqueda a un área alrededor de Posadas, Argentina
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${mapboxgl.accessToken}&country=ar&proximity=-55.895494,-27.370536&bbox=-56.1,-27.5,-55.7,-27.2&limit=5&language=es`,
      )

      const data = await response.json()

      if (data && data.features) {
        setAddressSuggestions(
          data.features.map((feature: any) => ({
            place_name: feature.place_name,
            center: feature.center,
          })),
        )
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error("Error buscando direcciones:", error)
    }
  }

  // Función para seleccionar una sugerencia
  const handleSelectSuggestion = (suggestion: { place_name: string; center: [number, number] }) => {
    setAddressInput(suggestion.place_name)
    setSelectedSuggestion(suggestion)
    setShowSuggestions(false)

    // Actualizar la ubicación del usuario y el marcador
    const userLoc = {
      lat: suggestion.center[1],
      lng: suggestion.center[0],
    }
    setUserLocation(userLoc)
    setUserMarker(userLoc)
    setUserAddress(suggestion.place_name)
    setShowRoute(true)

    // Si hay una tienda seleccionada, calcular distancia
    if (selectedStore) {
      calculateDistance(userLoc.lat, userLoc.lng, selectedStore.location[0], selectedStore.location[1])
    }
  }

  // Función para calcular la distancia entre dos puntos geográficos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c // Distancia en km

    setDistance(distance)

    // Calcular costo de envío basado en la distancia
    const cost = calculateShippingCost(distance)
    setShippingCost(cost)

    return distance
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

  // Manejar la selección de tienda desde el mapa
  const handleStoreSelect = (store: StoreType) => {
    setSelectedStore(store)

    // Si hay ubicación de usuario, calcular distancia
    if (userLocation) {
      calculateDistance(userLocation.lat, userLocation.lng, store.location[0], store.location[1])
    }
  }

  // Función para formatear la duración en minutos
  const formatDuration = (seconds: number): string => {
    if (!seconds) return "0 min"
    const minutes = Math.round(seconds / 60)
    if (minutes < 60) {
      return `${minutes} min`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Coordinar logística</h2>
        <p className="opacity-90">Elige cómo quieres gestionar la entrega y recogida de tu dispositivo</p>
      </div>

      <div className="p-6">
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
              onClick={() => setSelected("store")}
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

              {selectedStore && (
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
              onClick={() => setSelected("pickup")}
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

              {userLocation && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {selectedStore ? (
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                          <div className="p-3 text-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Distancia</div>
                            <div className="text-lg font-semibold">{distance?.toFixed(1)} km</div>
                          </div>
                          <div className="p-3 text-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Tiempo est.</div>
                            <div className="text-lg font-semibold">
                              {routeInfo.duration ? formatDuration(routeInfo.duration) : "Calculando..."}
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Precio de envío:</span>
                            <span className="font-bold text-red-600 text-lg">{formatCurrency(shippingCost)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600 dark:text-amber-400">Calculando distancia...</p>
                  )}
                </div>
              )}

              {!userLocation && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Por favor, indica tu ubicación en el mapa
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mapa interactivo - solo visible para entrega a domicilio */}
        {selected === "pickup" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-red-500" />
                Nuestras sucursales
              </h3>
              <Button variant="outline" size="sm" onClick={handleGetUserLocation} className="flex items-center gap-1">
                <Navigation className="h-4 w-4" />
                Mi ubicación
              </Button>
            </div>

            {/* Saved addresses from profile/checkout */}
            <div className="mb-4 rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookUser className="h-4 w-4 text-gray-500" />
                  Mis direcciones guardadas
                </div>
                <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">Gestionar</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Mis direcciones</DialogTitle>
                    </DialogHeader>
                    {user ? <AddressList userId={user.uid} /> : <div className="text-sm text-gray-500">Inicia sesión para gestionar direcciones</div>}
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                <div className="flex-1">
                  <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                    <SelectTrigger>
                      <SelectValue placeholder={addressesLoading ? "Cargando direcciones..." : "Elegí una dirección guardada"} />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const a = addresses.find((x) => x.id === selectedAddressId)
                    if (a) geocodeAddress(a.full)
                  }}
                  disabled={!selectedAddressId}
                >
                  Usar esta dirección
                </Button>
              </div>
            </div>

            {/* Buscador de direcciones con autocompletado */}
            <div className="relative w-full mb-4">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Ingresa tu dirección"
                    value={addressInput}
                    onChange={handleAddressInput}
                    onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                    className="pl-10"
                  />
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <Button
                  onClick={() => selectedSuggestion && handleSelectSuggestion(selectedSuggestion)}
                  disabled={!selectedSuggestion}
                >
                  Buscar
                </Button>
              </div>

              {/* Lista de sugerencias */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                  {addressSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-start"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <MapPin className="h-4 w-4 mt-1 mr-2 flex-shrink-0 text-red-500" />
                      <span className="text-sm">{suggestion.place_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Componente del mapa con Mapbox */}
            <div className="h-[400px] md:h-[450px] w-full relative rounded-lg overflow-hidden">
              <MapFallback
                className="h-full w-full absolute inset-0"
                userMarker={userMarker}
                storeLocation={
                  selectedStore ? { lat: selectedStore.location[0], lng: selectedStore.location[1] } : null
                }
                showRoute={showRoute && userMarker !== null && selectedStore !== null}
                destinationIconColor="red"
                storeIconType="phoneRepair"
                storeIconColor="red"
                animatedRoute={true}
              />
            </div>

            {/* Información de ubicación del usuario */}
            {userLocation && userAddress && (
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
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={onBack} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selected || (selected === "pickup" && !userLocation)}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 flex items-center"
          >
            Continuar <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
