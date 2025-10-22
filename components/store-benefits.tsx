import { CreditCard, Truck, Shield } from "lucide-react"

export default function StoreBenefits() {
  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 py-2 border-y border-gray-200 dark:border-gray-800">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Beneficio 1: Hasta 12 cuotas */}
          <div className="flex items-center py-3 border-b md:border-b-0 border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0 w-12 flex justify-center">
              <CreditCard className="h-7 w-7 text-red-500" />
            </div>
            <div className="ml-4">
              <h3 className="font-bold text-base md:text-lg">Hasta 12 cuotas</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">abonando con tarjetas de crédito</p>
            </div>
          </div>

          {/* Separador vertical (visible solo en desktop) */}
          <div className="hidden md:block h-12 w-px bg-gray-300 dark:bg-gray-700"></div>

          {/* Beneficio 2: Envíos a todo el país */}
          <div className="flex items-center py-3 border-b md:border-b-0 border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0 w-12 flex justify-center">
              <Truck className="h-7 w-7 text-red-500" />
            </div>
            <div className="ml-4">
              <h3 className="font-bold text-base md:text-lg">Envíos a todo el país</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">trabajamos con múltiples empresas</p>
            </div>
          </div>

          {/* Separador vertical (visible solo en desktop) */}
          <div className="hidden md:block h-12 w-px bg-gray-300 dark:bg-gray-700"></div>

          {/* Beneficio 3: Garantía oficial */}
          <div className="flex items-center py-3">
            <div className="flex-shrink-0 w-12 flex justify-center">
              <Shield className="h-7 w-7 text-red-500" />
            </div>
            <div className="ml-4">
              <h3 className="font-bold text-base md:text-lg">Garantía oficial</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">de hasta 36 meses en todos los productos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
