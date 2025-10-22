"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return // Skip if running on the server
    }

    const mediaQueryList = window.matchMedia(query)

    const handleChange = () => {
      setMatches(mediaQueryList.matches)
    }

    // Set initial value
    setMatches(mediaQueryList.matches)

    // Listen for changes
    mediaQueryList.addEventListener("change", handleChange)

    // Remove listener on unmount
    return () => {
      mediaQueryList.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches
}
