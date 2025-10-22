"use client"

import type React from "react"

import { useState, useRef, useLayoutEffect, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Point {
  x: number
  y: number
  id: number
}

interface PatternLockProps {
  onChange: (pattern: number[]) => void
  className?: string
}

export function PatternLock({ onChange, className }: PatternLockProps) {
  const [pattern, setPattern] = useState<number[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Calculate points based on container dimensions
  const calculatePoints = () => {
    if (!containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Only proceed if we have valid dimensions
    if (width <= 0 || height <= 0) return

    const cellWidth = width / 3
    const cellHeight = height / 3

    const newPoints: Point[] = []
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        newPoints.push({
          x: cellWidth * (x + 0.5),
          y: cellHeight * (y + 0.5),
          id: y * 3 + x + 1,
        })
      }
    }
    setPoints(newPoints)
    setIsInitialized(true)
  }

  // Use useLayoutEffect to calculate points before browser paints
  useLayoutEffect(() => {
    // Initial calculation
    calculatePoints()

    // Force a recalculation after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      calculatePoints()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Add resize observer to recalculate on container size changes
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      calculatePoints()
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
      resizeObserver.disconnect()
    }
  }, [])

  // Add window resize listener as a fallback
  useEffect(() => {
    const handleResize = () => calculatePoints()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleMouseDown = (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    setPattern([id])
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setCurrentPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
  }

  const handleTouchStart = (id: number, e: React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    setPattern([id])
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect && e.touches[0]) {
      setCurrentPoint({ x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentPoint({ x, y })

    // Check if we're over a point
    const point = findNearestPoint(x, y)
    if (point && !pattern.includes(point.id)) {
      setPattern([...pattern, point.id])
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing || !containerRef.current || !e.touches[0]) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const y = e.touches[0].clientY - rect.top
    setCurrentPoint({ x, y })

    // Check if we're over a point
    const point = findNearestPoint(x, y)
    if (point && !pattern.includes(point.id)) {
      setPattern([...pattern, point.id])
    }
  }

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false)
      setCurrentPoint(null)
      onChange(pattern)
    }
  }

  const handleTouchEnd = () => {
    if (isDrawing) {
      setIsDrawing(false)
      setCurrentPoint(null)
      onChange(pattern)
    }
  }

  const findNearestPoint = (x: number, y: number) => {
    const threshold = 30 // Distance threshold in pixels
    for (const point of points) {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))
      if (distance < threshold) {
        return point
      }
    }
    return null
  }

  const resetPattern = () => {
    setPattern([])
    onChange([])
  }

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className={cn(
          "relative w-full aspect-square max-w-[300px] mx-auto bg-gray-100 rounded-lg touch-none",
          className,
        )}
        style={{ minHeight: "240px" }} // Ensure minimum height even before initialization
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Draw the points */}
        {points.map((point) => (
          <div
            key={point.id}
            className={cn(
              "absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 border-2",
              pattern.includes(point.id) ? "bg-blue-500 border-blue-600" : "bg-gray-300 border-gray-400",
            )}
            style={{ left: point.x, top: point.y }}
            onMouseDown={(e) => handleMouseDown(point.id, e)}
            onTouchStart={(e) => handleTouchStart(point.id, e)}
          />
        ))}

        {/* Draw the lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {pattern.length > 1 &&
            pattern.slice(0, -1).map((id, index) => {
              const start = points.find((p) => p.id === id)
              const end = points.find((p) => p.id === pattern[index + 1])
              if (start && end) {
                return (
                  <line
                    key={`${start.id}-${end.id}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                )
              }
              return null
            })}
          {isDrawing && currentPoint && pattern.length > 0 && (
            <line
              x1={points.find((p) => p.id === pattern[pattern.length - 1])?.x || 0}
              y1={points.find((p) => p.id === pattern[pattern.length - 1])?.y || 0}
              x2={currentPoint.x}
              y2={currentPoint.y}
              stroke="#3b82f6"
              strokeWidth="2"
            />
          )}
        </svg>

        {/* Show loading indicator if not initialized */}
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm">
          {pattern.length > 0 ? (
            <span>Patrón: {pattern.join(" → ")}</span>
          ) : (
            <span className="text-gray-500">Dibuje el patrón</span>
          )}
        </div>
        <button type="button" onClick={resetPattern} className="text-sm text-blue-600 hover:text-blue-800">
          Reiniciar
        </button>
      </div>
    </div>
  )
}
