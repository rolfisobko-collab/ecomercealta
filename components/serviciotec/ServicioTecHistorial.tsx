"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Eye, Printer, DollarSign, Trash2, Calendar } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { formatCurrency } from "@/components/cash-register/currency-utils"
import { useRouter } from "next/navigation"

interface ServicioTecnico {
  id: string
  customerName: string
  customerDNI: string
  phoneNumber: string
  deviceBrand: string
  deviceModel: string
  issueDescription: string
  unlockMethod: string
  devicePassword?: string
  patternCode?: number[]
  price: number
  currency: string
  status: "pending" | "in_progress" | "completed"
  isPaid: boolean
  deliveryDate?: string
  createdAt: any
  updatedAt: any
}

export default function ServicioTecHistorial() {
  const { toast } = useToast()
  const router = useRouter()
  const [services, setServices] = useState<ServicioTecnico[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredServices, setFilteredServices] = useState<ServicioTecnico[]>([])

  const loadServices = async () => {
    try {
      setIsLoading(true)
      console.log("Cargando servicios técnicos...")

      const servicesRef = collection(db, "technicalServices")
      const q = query(servicesRef, orderBy("createdAt", "desc"))

      const snapshot = await getDocs(q)
      console.log(`Servicios encontrados: ${snapshot.size}`)

      if (!snapshot.empty) {
        const servicesData = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            customerName: data.customerName || "Sin nombre",
            customerDNI: data.customerDNI || "",
            phoneNumber: data.phoneNumber || "",
            deviceBrand: data.deviceBrand || "Sin marca",
            deviceModel: data.deviceModel || "",
            issueDescription: data.issueDescription || "Sin descripción",
            unlockMethod: data.unlockMethod || "contraseña",
            devicePassword: data.devicePassword || "",
            patternCode: data.patternCode || [],
            price: data.price || 0,
            currency: data.currency || "PESO",
            status: data.status || "pending",
            isPaid: data.isPaid || false,
            deliveryDate: data.deliveryDate || null,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as ServicioTecnico
        })

        console.log("Servicios procesados correctamente:", servicesData.length)
        setServices(servicesData)
        setFilteredServices(servicesData)
      } else {
        console.log("No se encontraron servicios técnicos")
        setServices([])
        setFilteredServices([])
      }
    } catch (error) {
      console.error("Error al cargar los servicios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios técnicos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredServices(services)
    } else {
      const filtered = services.filter(
        (service) =>
          service.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.deviceBrand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.deviceModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.issueDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.id?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredServices(filtered)
    }
  }, [searchTerm, services])

  const handleStatusChange = async (serviceId: string, newStatus: string) => {
    try {
      const serviceRef = doc(db, "technicalServices", serviceId)
      await updateDoc(serviceRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })

      toast({
        title: "Estado actualizado",
        description: "El estado del servicio ha sido actualizado",
      })

      loadServices()
    } catch (error) {
      console.error("Error al actualizar el estado:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const handleSetDeliveryDate = async (serviceId: string) => {
    try {
      const modal = document.createElement("div")
      modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      modal.onclick = () => modal.remove()

      const content = document.createElement("div")
      content.className = "bg-white p-6 rounded-lg max-w-md mx-auto w-full"
      content.onclick = (e) => e.stopPropagation()

      const today = new Date()
      const defaultDeliveryDate = new Date()
      defaultDeliveryDate.setDate(today.getDate() + 3)
      const formattedDefaultDate = defaultDeliveryDate.toISOString().split("T")[0]

      content.innerHTML = `
        <h3 class="text-xl font-bold mb-4">Establecer Fecha de Entrega</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Fecha estimada de entrega:
          </label>
          <input 
            type="date" 
            id="delivery-date-input" 
            class="w-full p-2 border rounded-md"
            value="${formattedDefaultDate}"
            min="${today.toISOString().split("T")[0]}"
          >
        </div>
        <div class="flex justify-end space-x-2">
          <button id="cancel-btn" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded">
            Cancelar
          </button>
          <button id="save-btn" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
            Guardar
          </button>
        </div>
      `

      modal.appendChild(content)
      document.body.appendChild(modal)

      document.getElementById("cancel-btn")?.addEventListener("click", () => modal.remove())

      document.getElementById("save-btn")?.addEventListener("click", async () => {
        const dateInput = document.getElementById("delivery-date-input") as HTMLInputElement
        const selectedDate = dateInput.value

        if (selectedDate) {
          try {
            const serviceRef = doc(db, "technicalServices", serviceId)
            await updateDoc(serviceRef, {
              deliveryDate: selectedDate,
              updatedAt: serverTimestamp(),
            })

            toast({
              title: "Fecha de entrega establecida",
              description: `Fecha establecida para el ${new Date(selectedDate).toLocaleDateString("es-AR")}`,
            })

            loadServices()
          } catch (error) {
            console.error("Error al guardar la fecha de entrega:", error)
            toast({
              title: "Error",
              description: "No se pudo guardar la fecha de entrega",
              variant: "destructive",
            })
          }
        }
        modal.remove()
      })
    } catch (error) {
      console.error("Error al configurar la fecha de entrega:", error)
    }
  }

  const handlePrintTicket = (service: ServicioTecnico) => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const ticketContent = `
<html>
<head>
<title>Ticket de Servicio Técnico</title>
<style>
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    max-width: 300px;
    font-weight: bold;
    text-transform: uppercase;
  }
  .header {
    text-align: center;
    margin-bottom: 20px;
    border-bottom: 1px dashed #000;
    padding-bottom: 10px;
  }
  .logo {
    max-width: 180px;
    margin: 0 auto;
    display: block;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 12px;
  }
  .info-label {
    font-weight: bold;
  }
  .footer {
    margin-top: 20px;
    text-align: center;
    font-size: 10px;
    border-top: 1px dashed #000;
    padding-top: 10px;
  }
  .ticket-id {
    text-align: center;
    font-size: 14px;
    margin: 10px 0;
  }
  .delivery-date {
    font-weight: bold;
    font-size: 12px;
    margin-top: 15px;
    margin-bottom: 5px;
    text-align: center;
    padding: 5px;
    border: 1px solid #000;
    border-radius: 3px;
  }
</style>
</head>
<body>
  <div class="header">
    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logofull%20negro%403x-BnYmD9dlNQdaFCcy1VCCt5XJH8mTyc.png" alt="Alta Telefonia" class="logo" />
  </div>

  <div class="ticket-id">Ticket #${service.id.substring(0, 6).toUpperCase()}</div>

  <div class="info-row">
    <span class="info-label">Fecha:</span>
    <span>${service.createdAt ? new Date(service.createdAt.toDate()).toLocaleDateString("es-AR") : new Date().toLocaleDateString("es-AR")}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Cliente:</span>
    <span>${service.customerName}</span>
  </div>
  <div class="info-row">
    <span class="info-label">DNI:</span>
    <span>${service.customerDNI || "No registrado"}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Teléfono:</span>
    <span>${service.phoneNumber || "No registrado"}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Dispositivo:</span>
    <span>${service.deviceBrand} ${service.deviceModel || ""}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Problema:</span>
    <span>${service.issueDescription || "Sin descripción"}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Precio:</span>
    <span>${formatCurrency(service.price, service.currency)}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Desbloqueo:</span>
    <span>${service.unlockMethod.toUpperCase()}</span>
  </div>

  ${
    service.deliveryDate
      ? `<div class="delivery-date">FECHA DE ENTREGA: ${new Date(service.deliveryDate).toLocaleDateString("es-AR")}</div>`
      : '<div class="delivery-date">FECHA DE ENTREGA: ___________________</div>'
  }
  
  <div class="footer">
    <p>Gracias por confiar en nuestros servicios</p>
    <p>Este ticket es su comprobante de servicio</p>
    <p>Conserve este ticket para retirar su dispositivo</p>
    
    <div class="terms" style="margin-top: 15px; font-size: 8px; text-align: left; border-top: 1px dashed #000; padding-top: 10px;">
      <p style="margin-bottom: 8px;"><strong>IMPORTANTE:</strong> SIN EL PRESENTE COMPROBANTE NO SE HARÁ ENTREGA DEL ARTICULO DETALLADO EN EL MISMO.</p>
      
      <p style="margin-bottom: 8px;">PASADOS LOS 30 DIAS PIERDE TODO DERECHO A RECLAMO Y SERÁ CONSIDERADO ABANDONO EN LOS TÉRMINOS DE LOS ART. 25252526 DEL CÓDIGO CIVIL DE LA REP. ARGENTINA QUEDANDO LA EMPRESA FACULTADA A DARLE EL DESTINO QUE CONSIDERE PERTINENTE SIN NECESIDAD DE INFORMAR PREVIAMENTE AL CLIENTE.</p>
      
      <p style="margin-bottom: 8px;"><strong>COSTO DE VERIFICACIÓN TÉCNICA:</strong> Se establece un cargo por verificación técnica de $6.000 para dispositivos Android y $10.000 para dispositivos iPhone. Esta tarifa se aplicará en caso de que el cliente decida no proceder con el servicio de reparación después de realizado el diagnóstico técnico. El monto corresponde al trabajo profesional de verificación y diagnóstico realizado.</p>
      
      <p style="margin-bottom: 8px;"><strong>GARANTIA CON RESPECTO A LA REPARACIÓN DE EQUIPOS</strong></p>
      
      <p style="margin-bottom: 8px;">NOTA: LA GARANTIA APLICARA UNICAMENTE POR EI TIEMPO DETERMINADO Y LA FALLA REPARADA, NO RECONOCIENDOSE TAL EN LOS CASOS EN QUE LA GARANTIA SE ENCUENTRE VENCIDA. EL EQUIPO SE ENCUENTRA GOLPEADO, MOJADO, QUEMADO C HAYA SIDO ATENDIDO POR TERCEROS.</p>
      
      <p>Si pasa la fecha de entrega sin retirar y sin aviso, tendrá un recargo de $ 500 por día.</p>
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>
`
      printWindow.document.write(ticketContent)
      printWindow.document.close()
    }
  }

  const handleDeleteService = async (serviceId: string, customerName: string) => {
    if (confirm(`¿Está seguro que desea eliminar el servicio de ${customerName}?`)) {
      try {
        const serviceRef = doc(db, "technicalServices", serviceId)
        await deleteDoc(serviceRef)

        toast({
          title: "Servicio eliminado",
          description: "El servicio ha sido eliminado correctamente",
        })

        loadServices()
      } catch (error) {
        console.error("Error al eliminar el servicio:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el servicio",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
      <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="relative w-full md:w-64">
          <Input
            type="text"
            placeholder="Buscar por cliente, dispositivo o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-8"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadServices}>
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

      <div className="border rounded-md overflow-auto max-h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Problema</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Cargando servicios...</p>
                </TableCell>
              </TableRow>
            ) : filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No se encontraron servicios que coincidan con la búsqueda"
                      : "No hay servicios registrados"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-mono text-xs">{service.id.substring(0, 6).toUpperCase()}</TableCell>
                  <TableCell>
                    {service.createdAt ? new Date(service.createdAt.toDate()).toLocaleDateString("es-AR") : "Sin fecha"}
                  </TableCell>
                  <TableCell>{service.customerName}</TableCell>
                  <TableCell>{`${service.deviceBrand} ${service.deviceModel || ""}`}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{service.issueDescription}</TableCell>
                  <TableCell>
                    <select
                      className={`p-1 border rounded text-xs ${
                        service.status === "completed"
                          ? "bg-green-50 text-green-800 border-green-200"
                          : service.status === "in_progress"
                            ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                            : "bg-red-50 text-red-800 border-red-200"
                      } focus:outline-none focus:ring-1 focus:ring-primary`}
                      value={service.status}
                      onChange={(e) => handleStatusChange(service.id, e.target.value)}
                    >
                      <option value="completed">Completado</option>
                      <option value="in_progress">En proceso</option>
                      <option value="pending">Pendiente</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {service.isPaid ? "Pagado" : "Pendiente"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        title="Ver detalles"
                        className="text-xs px-2 py-1 h-8 bg-transparent"
                        onClick={() => {
                          // Mostrar modal con detalles
                          const modal = document.createElement("div")
                          modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                          modal.onclick = () => modal.remove()

                          const content = document.createElement("div")
                          content.className = "bg-white p-4 rounded-lg max-w-md mx-auto"
                          content.onclick = (e) => e.stopPropagation()

                          content.innerHTML = `
                            <h3 class="text-lg font-bold mb-2">Detalles del Servicio</h3>
                            <div class="space-y-3">
                              <div class="grid grid-cols-3 gap-2">
                                <span class="font-semibold">ID:</span>
                                <span class="col-span-2 font-mono">${service.id}</span>
                              </div>
                              <div class="grid grid-cols-3 gap-2">
                                <span class="font-semibold">Cliente:</span>
                                <span class="col-span-2">${service.customerName}</span>
                              </div>
                              <div class="grid grid-cols-3 gap-2">
                                <span class="font-semibold">DNI:</span>
                                <span class="col-span-2">${service.customerDNI || "No registrado"}</span>
                              </div>
                              <div class="grid grid-cols-3 gap-2">
                                <span class="font-semibold">Teléfono:</span>
                                <span class="col-span-2">${service.phoneNumber || "No registrado"}</span>
                              </div>
                              <div class="grid grid-cols-3 gap-2">
                                <span class="font-semibold">Dispositivo:</span>
                                <span class="col-span-2">${service.deviceBrand} ${service.deviceModel || ""}</span>
                              </div>
                              <div class="grid grid-cols-3 gap-2">
                                <span class="font-semibold">Problema:</span>
                                <span class="col-span-2">${service.issueDescription}</span>
                              </div>
                              <div class="grid grid-cols-3 gap-2">
                                <span class="font-semibold">Precio:</span>
                                <span class="col-span-2">${formatCurrency(service.price, service.currency)}</span>
                              </div>
                              <div class="grid grid-cols-3 gap-2">
                                <span class="font-semibold">Método de desbloqueo:</span>
                                <span class="col-span-2 capitalize">${service.unlockMethod}</span>
                              </div>
                              ${
                                service.unlockMethod === "patron" &&
                                service.patternCode &&
                                service.patternCode.length > 0
                                  ? `<div class="grid grid-cols-3 gap-2">
                                       <span class="font-semibold">Patrón:</span>
                                       <span class="col-span-2 font-mono bg-gray-100 px-2 py-1 rounded">${service.patternCode.join(" → ")}</span>
                                     </div>`
                                  : service.unlockMethod === "pin" && service.devicePassword
                                    ? `<div class="grid grid-cols-3 gap-2">
                                         <span class="font-semibold">PIN:</span>
                                         <span class="col-span-2 font-mono bg-gray-100 px-2 py-1 rounded">${service.devicePassword}</span>
                                       </div>`
                                    : service.unlockMethod === "contraseña" && service.devicePassword
                                      ? `<div class="grid grid-cols-3 gap-2">
                                           <span class="font-semibold">Contraseña:</span>
                                           <span class="col-span-2 font-mono bg-gray-100 px-2 py-1 rounded">${service.devicePassword}</span>
                                         </div>`
                                      : ""
                              }
                              ${
                                service.deliveryDate
                                  ? `
                              <div class="grid grid-cols-3 gap-2">
                                <span class="font-semibold">Fecha de entrega:</span>
                                <span class="col-span-2 font-medium text-blue-600">${new Date(service.deliveryDate).toLocaleDateString("es-AR")}</span>
                              </div>`
                                  : ""
                              }
                            </div>
                            <div class="mt-6 flex justify-end">
                              <button class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded" onclick="this.closest('.fixed').remove()">
                                Cerrar
                              </button>
                            </div>
                          `

                          modal.appendChild(content)
                          document.body.appendChild(modal)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        title="Establecer fecha de entrega"
                        className="text-xs px-2 py-1 h-8 bg-transparent"
                        onClick={() => handleSetDeliveryDate(service.id)}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        title="Imprimir ticket"
                        className="text-xs px-2 py-1 h-8 bg-transparent"
                        onClick={() => handlePrintTicket(service)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        title={
                          service.isPaid ? "Servicio ya pagado - No se puede cobrar nuevamente" : "Cobrar servicio"
                        }
                        className={`text-xs px-2 py-1 h-8 ${
                          service.isPaid
                            ? "opacity-30 cursor-not-allowed bg-gray-100 border-gray-200 pointer-events-none"
                            : "bg-green-50 hover:bg-green-100 border-green-200"
                        }`}
                        disabled={service.isPaid}
                        onClick={(event) => {
                          // Double check - if service is already paid, show error and return immediately
                          if (service.isPaid) {
                            toast({
                              title: "Error - Servicio ya cobrado",
                              description: "Este servicio técnico ya ha sido pagado. No se puede cobrar nuevamente.",
                              variant: "destructive",
                            })
                            return
                          }

                          // Prevenir múltiples clics
                          const button = event.currentTarget as HTMLButtonElement
                          if (button.disabled) return
                          button.disabled = true

                          try {
                            // Verificar si ya existe en localStorage para evitar duplicados
                            const existingService = localStorage.getItem("technicalServiceToCobrar")
                            if (existingService) {
                              const parsed = JSON.parse(existingService)
                              if (parsed.id === service.id) {
                                toast({
                                  title: "Servicio ya enviado",
                                  description: "Este servicio ya fue enviado a la caja anteriormente",
                                  variant: "destructive",
                                })
                                button.disabled = false
                                return
                              }
                            }

                            // Set a flag to indicate we want to show this service in caja
                            localStorage.setItem(
                              "technicalServiceToCobrar",
                              JSON.stringify({
                                id: service.id,
                                customerName: service.customerName,
                                customerPhone: service.phoneNumber,
                                brand: service.deviceBrand,
                                model: service.deviceModel,
                                issue: service.issueDescription,
                                estimatedCost: service.price,
                                currency: service.currency,
                                status: service.status,
                                isPaid: service.isPaid,
                                timestamp: Date.now(), // Agregar timestamp para evitar duplicados
                              }),
                            )

                            toast({
                              title: "Servicio enviado a caja",
                              description: "El servicio técnico ha sido enviado a la caja para su cobro",
                              duration: 3000,
                            })

                            // Redirect to caja with a flag to show technical service tab
                            setTimeout(() => {
                              router.push("/admin/caja?showTechnical=true")
                            }, 1500)
                          } catch (error) {
                            console.error("Error al enviar servicio a caja:", error)
                            button.disabled = false
                          }
                        }}
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        title="Eliminar servicio"
                        className="text-xs px-2 py-1 h-8 bg-red-50 hover:bg-red-100 border-red-200"
                        onClick={() => handleDeleteService(service.id, service.customerName)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredServices.length > 0 && (
        <div className="flex justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredServices.length} servicio{filteredServices.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  )
}
