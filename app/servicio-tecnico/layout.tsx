import type React from "react"
import "../globals.css"
import "./mapbox-styles.css" // Ensure Mapbox styles are imported
import "./leaflet-styles.css"

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  // Force client-side rendering for map components
  return <>{children}</>
}
