"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Corregir el problema de los íconos de Leaflet
import icon from "leaflet/dist/images/marker-icon.png"
import iconShadow from "leaflet/dist/images/marker-shadow.png"

const DefaultIcon = L.Icon.extend({
  options: {
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  },
})

L.Marker.prototype.options.icon = new DefaultIcon()

interface StoreType {
  id: string
  name: string
  address: string
  location: [number, number] // [lat, lng]
  phone: string
  hours: string
}

interface MapComponentProps {
  stores: StoreType[]
  userLocation: { lat: number; lng: number } | null
  onStoreSelect: (store: StoreType) => void
  selectedStore: StoreType | null
}

export default function MapComponent({ stores, userLocation, onStoreSelect, selectedStore }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const storeMarkersRef = useRef<L.Marker[]>([])

  // Inicializar mapa
  useEffect(() => {
    // Crear mapa si no existe
    if (!mapRef.current) {
      // Inicializar el mapa
      mapRef.current = L.map("map", {
        center: [-27.36714, -55.89344], // Centro inicial (tienda principal)
        zoom: 13,
        layers: [
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }),
        ],
      })

      // Crear íconos personalizados para las tiendas
      const storeIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; border: 2px solid #ff3333; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <div style="color: #ff3333; font-size: 18px;">S</div>
              </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const mainStoreIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: #ff3333; border-radius: 50%; width: 34px; height: 34px; display: flex; justify-content: center; align-items: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <div style="color: white; font-size: 18px; font-weight: bold;">S</div>
              </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })

      // Añadir marcadores para las tiendas
      stores.forEach((store) => {
        const marker = L.marker(store.location, {
          icon: store.id === "main" ? mainStoreIcon : storeIcon,
        }).addTo(mapRef.current!)

        // Crear popup con información de la tienda
        const popupContent = `
          <div style="padding: 5px; max-width: 200px;">
            <h4 style="margin: 0 0 5px 0; color: #ff3333; font-weight: bold;">${store.name}</h4>
            <p style="margin: 0 0 5px 0; font-size: 12px;">${store.address}</p>
            <p style="margin: 0 0 5px 0; font-size: 11px; color: #666;">${store.hours}</p>
            <p style="margin: 0; font-size: 12px; font-weight: 500; color: #ff3333;">${store.phone}</p>
          </div>
        `
        marker.bindPopup(popupContent)

        // Evento de clic en el marcador
        marker.on("click", () => {
          onStoreSelect(store)
        })

        // Guardar referencia al marcador
        storeMarkersRef.current.push(marker)
      })
    }

    // Limpiar al desmontar
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        storeMarkersRef.current = []
        userMarkerRef.current = null
      }
    }
  }, [])

  // Actualizar marcador de usuario cuando cambia la ubicación
  useEffect(() => {
    if (!mapRef.current) return

    // Eliminar marcador anterior si existe
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    // Añadir nuevo marcador si hay ubicación
    if (userLocation) {
      // Crear ícono personalizado para el usuario
      const userIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: #4285F4; border-radius: 50%; width: 20px; height: 20px; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      // Crear y añadir marcador
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
      }).addTo(mapRef.current)

      // Centrar mapa en la ubicación del usuario
      mapRef.current.setView([userLocation.lat, userLocation.lng], 14)
    }
  }, [userLocation])

  // Resaltar tienda seleccionada
  useEffect(() => {
    if (!mapRef.current || !selectedStore) return

    // Encontrar el marcador de la tienda seleccionada
    const storeMarker = storeMarkersRef.current.find((_, index) => stores[index].id === selectedStore.id)

    if (storeMarker) {
      // Abrir el popup de la tienda seleccionada
      storeMarker.openPopup()

      // Si hay ubicación de usuario, ajustar la vista para mostrar ambos
      if (userLocation) {
        const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng], selectedStore.location])
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })
      } else {
        // Si no hay ubicación de usuario, centrar en la tienda
        mapRef.current.setView(selectedStore.location, 15)
      }
    }
  }, [selectedStore, userLocation])

  return (
    <div
      id="map"
      className="h-[400px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner"
    />
  )
}
