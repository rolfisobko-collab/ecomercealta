"use client"

import { useState, useEffect } from "react"

interface MapIframeProps {
  height?: string
  width?: string
  className?: string
}

export function MapIframe({ height = "400px", width = "100%", className = "" }: MapIframeProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div style={{ height, width }} className={`bg-gray-100 animate-pulse rounded-lg ${className}`}></div>
  }

  return (
    <iframe
      src="/map-fallback.html"
      height={height}
      width={width}
      className={`border-0 rounded-lg ${className}`}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    ></iframe>
  )
}
