"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { technicalServiceService } from "@/services/hybrid/technicalServiceService"
import { productService } from "@/services/hybrid/productService"
import type { ServiceBrand, ServiceModel, TechnicalService } from "@/models/TechnicalService"

interface QuoteResultProps {
  brandId: string
  modelId: string
  issueId: string
  logisticsType: string
  logisticsPrice: number
  onReset: () => void
}

export function QuoteResult({ brandId, modelId, issueId, logisticsType, logisticsPrice, onReset }: QuoteResultProps) {
  const [brands, setBrands] = useState<ServiceBrand[]>([])
  const [models, setModels] = useState<ServiceModel[]>([])
  const [services, setServices] = useState<TechnicalService[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceProducts, setServiceProducts] = useState<Array<{ id: string; productId: string; quantity: number; isOptional: boolean }>>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const selectedProduct = useMemo(() => allProducts.find((p) => p.id === selectedProductId), [allProducts, selectedProductId])
  const [submitting, setSubmitting] = useState(false)
  const [requestId, setRequestId] = useState<string>("")
  const [submitError, setSubmitError] = useState<string>("")

  useEffect(() => {
    const unsubscribeBrands = technicalServiceService.onBrandsSnapshot((brandsData) => {
      setBrands(brandsData)
    })

    const unsubscribeModels = technicalServiceService.onModelsSnapshot((modelsData) => {
      setModels(modelsData)
    })

    const unsubscribeServices = technicalServiceService.onSnapshot((servicesData) => {
      setServices(servicesData)
      setLoading(false)
    })

    return () => {
      unsubscribeBrands()
      unsubscribeModels()
      unsubscribeServices()
    }
  }, [])

  // Cargar productos requeridos del servicio (repuestos) y catálogo para nombres/precios
  useEffect(() => {
    const load = async () => {
      try {
        const [sp, catalog] = await Promise.all([
          technicalServiceService.getServiceProductsByService(issueId),
          productService.getAll(),
        ])
        setServiceProducts(sp as any)
        setAllProducts(catalog as any[])
        // Si hay no opcionales, no seleccionar por defecto; si no hay no opcionales y solo hay uno, preseleccionar
        const nonOptional = (sp as any[]).filter((x) => !x.isOptional)
        if (nonOptional.length === 0 && (sp as any[]).length === 1) {
          setSelectedProductId((sp as any[])[0].productId)
        }
      } catch (e) {
        // silencioso
      }
    }
    load()
  }, [issueId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const brand = brands.find((b) => b.id === brandId)
  const model = models.find((m) => m.id === modelId)
  const service = services.find((s) => s.id === issueId)

  if (!brand || !model || !service) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: No se pudieron cargar los datos del servicio</p>
        <Button onClick={onReset} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  const servicePrice = service.basePrice
  const selectedProductPrice = selectedProduct ? Number(selectedProduct.price || 0) : 0
  const totalPrice = servicePrice + selectedProductPrice + logisticsPrice
  const requiresProduct = serviceProducts.some((p) => !p.isOptional)

  const getLogisticsText = (type: string) => {
    switch (type) {
      case "pickup":
        return "Retiro y entrega a domicilio"
      case "workshop":
        return "Llevar al taller"
      case "home":
        return "Servicio a domicilio"
      default:
        return type
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-2">¡Cotización Lista!</h2>
        <p className="text-gray-600">Aquí tienes el resumen de tu servicio técnico</p>
      </div>

      <div className="bg-white border-2 border-green-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-4 pb-4 border-b">
          {brand.logoUrl && (
            <img src={brand.logoUrl || "/placeholder.svg"} alt={brand.name} className="h-12 w-12 object-contain" loading="lazy" />
          )}
          <div>
            <h3 className="text-lg font-semibold">
              {brand.name} {model.name}
            </h3>
            <p className="text-gray-600">{service.name}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Servicio:</span>
            <span className="font-semibold">{service.name}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-700">Categoría:</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{service.category}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-700">Tiempo estimado:</span>
            <span className="font-semibold">
              {Math.floor(service.estimatedTime / 60)}h {service.estimatedTime % 60}m
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-700">Precio del servicio:</span>
            <span className="font-semibold text-green-600">${servicePrice.toFixed(2)}</span>
          </div>

          {/* Selector de repuesto si el servicio tiene productos asociados */}
          {serviceProducts.length > 0 ? (
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Repuesto:</span>
                {requiresProduct && <span className="text-xs text-red-600">Obligatorio</span>}
              </div>
              <div className="mt-2 space-y-2">
                {serviceProducts.map((sp) => {
                  const p = allProducts.find((x) => x.id === sp.productId)
                  const label = p ? `${p.name} - $${Number(p.price || 0).toFixed(2)}` : sp.productId
                  return (
                    <label key={sp.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="service-product"
                        className="h-4 w-4"
                        checked={selectedProductId === sp.productId}
                        onChange={() => setSelectedProductId(sp.productId)}
                      />
                      <span className="text-sm">{label}</span>
                      {sp.isOptional && (
                        <span className="ml-2 text-xs text-gray-500">(Opcional)</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="pt-2 text-sm text-gray-500">Sin repuestos requeridos</div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-700">Logística ({getLogisticsText(logisticsType)}):</span>
            <span className="font-semibold text-blue-600">${logisticsPrice.toFixed(2)}</span>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-green-600">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {service.description && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Descripción del servicio:</h4>
            <p className="text-gray-700 text-sm">{service.description}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onReset} variant="outline" className="flex-1 bg-transparent">
          Nueva Cotización
        </Button>
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60"
          disabled={submitting || (requiresProduct && !selectedProductId)}
          onClick={async () => {
            setSubmitting(true)
            setSubmitError("")
            setRequestId("")
            try {
              const res = await fetch('/api/service-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  brandId,
                  modelId,
                  issueId,
                  selectedProductId: selectedProductId || null,
                  logisticsType,
                  logisticsPrice,
                  servicePrice,
                  productPrice: selectedProductPrice,
                  totalPrice,
                }),
              })
              if (!res.ok) throw new Error(await res.text())
              const data = await res.json() as any
              setRequestId(String(data.id || ''))
            } catch (e: any) {
              setSubmitError(typeof e?.message === 'string' ? e.message : 'No se pudo registrar el pedido')
            } finally {
              setSubmitting(false)
            }
          }}
        >
          {submitting ? 'Enviando…' : 'Solicitar Servicio'}
        </Button>
      </div>

      {requestId && (
        <div className="mt-3 text-sm text-green-700">
          Pedido registrado. ID: <span className="font-mono">{requestId}</span>
        </div>
      )}
      {submitError && (
        <div className="mt-3 text-sm text-red-600">
          {submitError}
        </div>
      )}
    </div>
  )
}
