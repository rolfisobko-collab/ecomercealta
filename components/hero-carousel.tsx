"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Mantendré la estructura del componente pero prepararé el array de slides para las nuevas imágenes.
  // Cuando me proporciones las nuevas imágenes, actualizaré este array.

  // Puedes proporcionarme las nuevas imágenes y actualizaré el siguiente array:
  const slides = [
    {
      id: 1,
      image: "/images/carousel/slide-01.jpg",
      alt: "Repuestos para todos los modelos de smartphones",
    },
    {
      id: 2,
      image: "/images/carousel/slide-02.jpg",
      alt: "Herramientas PRO para técnicos PRO",
    },
    {
      id: 3,
      image: "/images/carousel/slide-03.png",
      alt: "Módulos para todas las marcas y modelos",
    },
  ]

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }, [slides.length])

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index)
  }, [])

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, 10000)
    return () => clearInterval(interval)
  }, [nextSlide])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Simple Image Carousel */}
      <div className="relative">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`transition-opacity duration-500 ease-in-out overflow-hidden rounded-3xl ${
              currentSlide === index ? "opacity-100 block" : "opacity-0 hidden"
            }`}
            style={{
              maxHeight: "400px",
            }}
          >
            <img
              src={slide.image || "/placeholder.svg"}
              alt={slide.alt}
              className="w-full h-auto object-cover rounded-3xl"
              style={{
                maxHeight: "400px",
                borderRadius: "28px",
              }}
            />
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white text-gray-800 p-2 rounded-full transition-colors shadow-sm"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white text-gray-800 p-2 rounded-full transition-colors shadow-sm"
          aria-label="Siguiente slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                currentSlide === index ? "bg-white" : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
