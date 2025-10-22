import { CashBalance } from "./CashBalance"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function BalanceTab() {
  return (
    <>
      <CashBalance />

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Operaciones</CardTitle>
          <CardDescription>Resumen de operaciones del día actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ventas</p>
                  <p className="text-3xl font-bold">12</p>
                  <p className="text-sm text-green-600 dark:text-green-400">$1,250.00</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos</p>
                  <p className="text-3xl font-bold">8</p>
                  <p className="text-sm text-green-600 dark:text-green-400">$850.00</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Egresos</p>
                  <p className="text-3xl font-bold">5</p>
                  <p className="text-sm text-red-600 dark:text-red-400">$320.00</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
