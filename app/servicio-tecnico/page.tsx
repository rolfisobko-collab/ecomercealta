"use client"

import { useState, useEffect } from "react"
import { BrandSelector } from "@/components/servicio-tecnico/brand-selector"
import { ModelSelector } from "@/components/servicio-tecnico/model-selector"
import { IssueSelector } from "@/components/servicio-tecnico/issue-selector"
import { QuoteResult } from "@/components/servicio-tecnico/quote-result"
// Añadir la importación del nuevo componente
import { LogisticsSelector } from "@/components/servicio-tecnico/logistics-selector"
import { Smartphone, Wrench, Calculator, Truck } from "lucide-react"

// Import MapFallback styles
import "./mapbox-styles.css"

import { technicalServiceService } from "@/services/hybrid/technicalServiceService"
import type { ServiceBrand, ServiceModel, TechnicalService } from "@/models/TechnicalService"

export default function ServicioTecnicoPage() {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  // Añadir estados para la logística
  const [selectedLogisticsType, setSelectedLogisticsType] = useState<string>("")
  const [logisticsPrice, setLogisticsPrice] = useState<number>(0)
  const [step, setStep] = useState<number>(1)

  const [brands, setBrands] = useState<ServiceBrand[]>([])
  const [models, setModels] = useState<ServiceModel[]>([])
  const [services, setServices] = useState<TechnicalService[]>([])
  const [loading, setLoading] = useState(true)

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

  

  // Función para reiniciar el proceso
  const resetQuote = () => {
    setSelectedBrand(null)
    setSelectedModel(null)
    setSelectedIssue(null)
    setSelectedLogisticsType("")
    setLogisticsPrice(0)
    setStep(1)
  }

  // Función para manejar la selección de marca
  const handleBrandSelect = (brandId: string) => {
    setSelectedBrand(brandId)
    setSelectedModel(null)
    setStep(2)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Función para manejar la selección de modelo
  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId)
    setStep(3)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Función para manejar la selección de problema
  const handleIssueSelect = (issueId: string) => {
    setSelectedIssue(issueId)
    setStep(4)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Función para manejar la selección de logística
  const handleLogisticsSelect = (type: string, price: number) => {
    setSelectedLogisticsType(type)
    setLogisticsPrice(price)
    setStep(5)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Servicio Técnico</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Cotiza la reparación de tu dispositivo en simples pasos
          </p>
        </div>

        {/* Pasos del proceso */}
        {step < 5 && (
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 1 ? "bg-red-600 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                }`}
              >
                <Smartphone className="h-5 w-5" />
              </div>
              <div className={`w-8 h-1 ${step > 1 ? "bg-red-600" : "bg-gray-200 dark:bg-gray-700"}`}></div>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 2 ? "bg-red-600 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                }`}
              >
                <Wrench className="h-5 w-5" />
              </div>
              <div className={`w-8 h-1 ${step > 2 ? "bg-red-600" : "bg-gray-200 dark:bg-gray-700"}`}></div>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 3 ? "bg-red-600 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                }`}
              >
                <Calculator className="h-5 w-5" />
              </div>
              <div className={`w-8 h-1 ${step > 3 ? "bg-red-600" : "bg-gray-200 dark:bg-gray-700"}`}></div>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 4 ? "bg-red-600 text-white" : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                }`}
              >
                <Truck className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        {/* Contenido según el paso actual */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 overflow-x-auto">
          {step === 1 && (
            <BrandSelector brands={brands} selectedBrand={selectedBrand} onSelectBrand={handleBrandSelect} />
          )}

          {step === 2 && selectedBrand && (
            <ModelSelector
              models={models.filter((model) => model.brandId === selectedBrand)}
              selectedModel={selectedModel}
              onSelectModel={handleModelSelect}
            />
          )}

          {step === 3 && (
            <IssueSelector services={services} selectedIssue={selectedIssue} onSelectIssue={handleIssueSelect} />
          )}

          {step === 4 && <LogisticsSelector onSelectLogistics={handleLogisticsSelect} onBack={() => setStep(3)} />}

          {step === 5 && selectedBrand && selectedModel && selectedIssue && (
            <QuoteResult
              brandId={selectedBrand}
              modelId={selectedModel}
              issueId={selectedIssue}
              logisticsType={selectedLogisticsType}
              logisticsPrice={logisticsPrice}
              onReset={resetQuote}
            />
          )}
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">Técnicos certificados</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Nuestros técnicos cuentan con certificaciones oficiales de las principales marcas.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">Repuestos originales</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Utilizamos repuestos originales o de la más alta calidad para todas nuestras reparaciones.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">Garantía de servicio</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Todas nuestras reparaciones cuentan con garantía de 3 meses por defectos de instalación.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
