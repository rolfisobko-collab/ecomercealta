"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

// Configurar el token de Mapbox
mapboxgl.accessToken = "pk.eyJ1Ijoicm9sZmlzb2JrbyIsImEiOiJjbGIzd3prbGEwMG04M29xd2c5N291MGd2In0.vcbWAiLYUBxC_PWgNjp5cQ"

interface MapFallbackProps {
  className?: string
  userMarker?: { lat: number; lng: number } | null
  storeLocation?: { lat: number; lng: number } | null
  showRoute?: boolean
}

// Ensure we return null if window is not available (for SSR)
export function MapFallback({
  className = "h-[400px]",
  userMarker,
  storeLocation,
  showRoute = false,
}: MapFallbackProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const routeRef = useRef<string | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Lista de sucursales
  const stores = [
    {
      position: [-55.895494, -27.370536],
      title: "Altatelefonia",
      address: "Catamarca 1928, N3300 Posadas, Misiones",
      phone: "+54 376 123-4567",
      hours: "Lunes a Viernes: 9:00 - 18:00, Sábados: 9:00 - 13:00",
      isMain: true,
    },
  ]

  useEffect(() => {
    // Check if window is available (client side only)
    if (typeof window === "undefined") return

    if (map.current || !mapContainer.current) return

    try {
      // Crear el mapa
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-55.895494, -27.370536], // Centro inicial (Altatelefonia)
        zoom: 12,
        attributionControl: true,
        preserveDrawingBuffer: true,
        trackResize: true,
      })

      // Añadir un evento para detectar errores de carga
      map.current.on("error", (e) => {
        console.error("Mapbox error:", e)
      })

      // Resize observer to handle responsive behavior
      const resizeObserver = new ResizeObserver(() => {
        if (map.current) {
          map.current.resize()
        }
      })

      if (mapContainer.current) {
        resizeObserver.observe(mapContainer.current)
      }

      // Añadir controles de navegación
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

      // Evento cuando el mapa termina de cargar
      map.current.on("load", () => {
        setIsMapLoaded(true)

        // Añadir fuente y capa para la ruta
        map.current!.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          },
        })

        map.current!.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#ff3333", // Rojo para coincidir con el tema de la página
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12,
              3, // Cuando el zoom es 12, ancho de línea 3
              16,
              7, // Cuando el zoom es 16, ancho de línea 7
            ],
            "line-opacity": 0.8,
            "line-blur": 1, // Efecto de suavizado
          },
        })

        // Después de añadir la primera capa de ruta, añadir esto:
        map.current!.addLayer(
          {
            id: "route-glow",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#ff3333",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                12,
                6, // Cuando el zoom es 12, ancho de línea 6
                16,
                12, // Cuando el zoom es 16, ancho de línea 12
              ],
              "line-opacity": 0.2,
              "line-blur": 4,
            },
          },
          "route",
        ) // Colocar detrás de la ruta principal

        // Añadir marcadores para las tiendas
        stores.forEach((store) => {
          // Crear elemento personalizado para el marcador
          const el = document.createElement("div")
          el.className = "store-marker"
          el.style.width = "40px"
          el.style.height = "40px"
          el.style.cursor = "pointer"

          // Crear un marcador con un ícono de tienda
          el.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="store-icon">
              <path d="M3 21h18M3 18h18M5 18V9.67a2 2 0 01.4-1.2L8.73 4a2 2 0 011.6-.8h3.34a2 2 0 011.6.8l3.33 4.47a2 2 0 01.4 1.2V18M8 18v-4a1 1 0 011-1h6a1 1 0 011 1v4"/>
            </svg>
          `

          // Agregar estilos al SVG
          const style = document.createElement("style")
          style.textContent = `
            .store-marker {
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #ff3333;
              border-radius: 50%;
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              border: 3px solid white;
              transform: translateY(-20px);
            }
            .store-icon {
              width: 24px;
              height: 24px;
            }
            .mapboxgl-popup-content {
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              padding: 12px;
            }
          `
          document.head.appendChild(style)

          // Crear popup con información de la tienda
          const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
            <div style="padding: 10px; max-width: 200px;">
              <h4 style="margin: 0 0 5px 0; color: #ff3333; font-weight: bold;">${store.title}</h4>
              <p style="margin: 0 0 5px 0; font-size: 12px;">${store.address}</p>
              <p style="margin: 0 0 5px 0; font-size: 11px; color: #666;">${store.hours}</p>
              <p style="margin: 0; font-size: 12px; font-weight: 500; color: #ff3333;">${store.phone}</p>
            </div>
          `)

          // Crear y añadir marcador
          new mapboxgl.Marker(el).setLngLat(store.position as [number, number]).setPopup(popup).addTo(map.current!)
        })
      })

      // Cleanup function to remove the observer
      return () => {
        if (mapContainer.current) {
          resizeObserver.unobserve(mapContainer.current)
        }

        if (userMarkerRef.current) {
          userMarkerRef.current.remove()
        }

        if (map.current) {
          map.current.remove()
          map.current = null
        }
      }
    } catch (error) {
      console.error("Error al inicializar el mapa:", error)
    }
  }, [])

  // Efecto para actualizar el marcador del usuario
  useEffect(() => {
    if (!map.current || !isMapLoaded) return

    // Si ya existe un marcador, eliminarlo
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    // Si hay una ubicación de usuario, añadir un marcador
    if (userMarker) {
      // Crear elemento personalizado para el marcador
      const el = document.createElement("div")
      el.className = "user-marker"
      el.style.width = "20px"
      el.style.height = "20px"
      el.style.borderRadius = "50%"
      el.style.backgroundColor = "#4285F4"
      el.style.border = "3px solid white"
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)"

      // Crear y añadir marcador
      userMarkerRef.current = new mapboxgl.Marker(el).setLngLat([userMarker.lng, userMarker.lat]).addTo(map.current)

      // Centrar el mapa en la ubicación del usuario
      map.current.flyTo({
        center: [userMarker.lng, userMarker.lat],
        zoom: 14,
        essential: true,
      })
    }
  }, [userMarker, isMapLoaded])

  // Efecto para mostrar la ruta entre el usuario y la tienda
  useEffect(() => {
    if (!map.current || !isMapLoaded || !showRoute || !userMarker || !storeLocation) return

    // Obtener la ruta usando la API de Directions de Mapbox
    const getRoute = async () => {
      try {
        // Ensure map instance is still valid (not cleaned up) and has canvas container
        if (!map.current || typeof (map.current as any).getCanvasContainer !== 'function') return
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userMarker.lng},${userMarker.lat};${storeLocation.lng},${storeLocation.lat}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        )

        const data = await response.json()

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          const routeGeometry = route.geometry
          const duration = route.duration // Duración en segundos

          // Emitir un evento personalizado con la duración del viaje
          const routeEvent = new CustomEvent("routeCalculated", {
            detail: {
              duration: duration,
              distance: route.distance,
            },
          })
          window.dispatchEvent(routeEvent)

          // Actualizar la fuente de datos de la ruta
          if (map.current) {
            const routeSource = map.current.getSource("route") as mapboxgl.GeoJSONSource
            if (routeSource) {
              routeSource.setData({
                type: "Feature",
                properties: {},
                geometry: routeGeometry,
              })
            }

            // Ajustar el mapa para mostrar toda la ruta
            const bounds = new mapboxgl.LngLatBounds()
            routeGeometry.coordinates.forEach((coord: [number, number]) => {
              bounds.extend(coord)
            })

            map.current.fitBounds(bounds, {
              padding: 50,
              maxZoom: 15,
            })
          }

          // Después de crear la ruta, añadir esto:
          // Marcar puntos de inicio y fin de la ruta
          if (routeGeometry.coordinates.length > 0) {
            // Punto de inicio (origen)
            const originEl = document.createElement("div")
            originEl.className = "route-marker origin-marker"
            originEl.innerHTML = `
              <div class="inner-circle"></div>
            `

            // Punto final (destino)
            const destinationEl = document.createElement("div")
            destinationEl.className = "route-marker destination-marker"
            destinationEl.innerHTML = `
              <div class="inner-circle"></div>
            `

            // Estilos para los marcadores
            const markerStyle = document.createElement("style")
            markerStyle.textContent = `
              .route-marker {
                width: 22px;
                height: 22px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 0 2px white;
              }
              .origin-marker {
                background-color: #2196f3;
              }
              .destination-marker {
                background-color: #ff3333;
              }
              .inner-circle {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background-color: white;
              }
            `
            document.head.appendChild(markerStyle)

            // Añadir marcadores al mapa, solo si el mapa sigue disponible
            const startCoord = routeGeometry.coordinates[0]
            const endCoord = routeGeometry.coordinates[routeGeometry.coordinates.length - 1]

            if (map.current) {
              try { new mapboxgl.Marker(originEl).setLngLat(startCoord).addTo(map.current) } catch {}
            }

            if (map.current) {
              try { new mapboxgl.Marker(destinationEl).setLngLat(endCoord).addTo(map.current) } catch {}
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener la ruta:", error)
      }
    }

    getRoute()
  }, [userMarker, storeLocation, showRoute, isMapLoaded])

  return (
    <div
      ref={mapContainer}
      className={`rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}
    />
  )
}
