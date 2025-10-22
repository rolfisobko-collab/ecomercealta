"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { RotateCcw, Save } from "lucide-react"
import { PatternLock } from "@/components/cash-register/PatternLock"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

interface ServicioTecnico {
  cliente: {
    nombre: string
    dni: string
    telefono: string
  }
  servicio: {
    costo: number
    moneda: string
  }
  dispositivo: {
    marca: string
    modelo: string
    metodoDesbloqueo: string
    contraseña: string
    problema: string
  }
}

const monedas = [
  { value: "PESO", label: "PESO" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
]

export default function ServicioTecForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [isRegistering, setIsRegistering] = useState(false)
  const [devicePattern, setDevicePattern] = useState<number[]>([])
  const [formData, setFormData] = useState<ServicioTecnico>({
    cliente: {
      nombre: "",
      dni: "",
      telefono: "",
    },
    servicio: {
      costo: 0,
      moneda: "PESO", // CORREGIDO: Por defecto en PESO
    },
    dispositivo: {
      marca: "",
      modelo: "",
      metodoDesbloqueo: "contraseña",
      contraseña: "",
      problema: "",
    },
  })

  const handleInputChange = (section: keyof ServicioTecnico, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const limpiarFormulario = () => {
    setFormData({
      cliente: { nombre: "", dni: "", telefono: "" },
      servicio: { costo: 0, moneda: "PESO" }, // CORREGIDO: Por defecto en PESO
      dispositivo: { marca: "", modelo: "", metodoDesbloqueo: "contraseña", contraseña: "", problema: "" },
    })
    setDevicePattern([])
  }

  const imprimirTicketServicio = (servicioId: string) => {
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

  <div class="ticket-id">Ticket #${servicioId}</div>

  <div class="info-row">
    <span class="info-label">Fecha:</span>
    <span>${new Date().toLocaleDateString("es-AR")}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Cliente:</span>
    <span>${formData.cliente.nombre}</span>
  </div>
  <div class="info-row">
    <span class="info-label">DNI:</span>
    <span>${formData.cliente.dni || "No registrado"}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Teléfono:</span>
    <span>${formData.cliente.telefono || "No registrado"}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Dispositivo:</span>
    <span>${formData.dispositivo.marca} ${formData.dispositivo.modelo || ""}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Problema:</span>
    <span>${formData.dispositivo.problema || "Sin descripción"}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Precio:</span>
    <span>$${formData.servicio.costo.toLocaleString()} ${formData.servicio.moneda === "PESO" ? "ARS" : formData.servicio.moneda}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Desbloqueo:</span>
    <span>${formData.dispositivo.metodoDesbloqueo.toUpperCase()}</span>
  </div>

  <div class="delivery-date">FECHA DE ENTREGA: ___________________</div>
  
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
    } else {
      alert("No se pudo abrir la ventana de impresión. Verifique que no esté bloqueada por el navegador.")
    }
  }

  const transferirACaja = (servicioId: string) => {
    // Guardar los datos del servicio en localStorage para que la caja los pueda usar
    const servicioParaCaja = {
      tipo: "servicio_tecnico",
      servicioId: servicioId,
      descripcion: `Servicio técnico: ${formData.cliente.nombre} - ${formData.dispositivo.marca} ${formData.dispositivo.modelo}`,
      precio: formData.servicio.costo,
      moneda: formData.servicio.moneda,
      cliente: formData.cliente.nombre,
      dispositivo: `${formData.dispositivo.marca} ${formData.dispositivo.modelo}`,
      problema: formData.dispositivo.problema,
      timestamp: Date.now(),
    }

    localStorage.setItem("servicioParaCaja", JSON.stringify(servicioParaCaja))

    // Mostrar confirmación
    toast({
      title: "Servicio transferido a caja",
      description: "El servicio ha sido enviado a la caja para su cobro",
      duration: 3000,
    })

    // Redirigir a la caja después de un breve delay
    setTimeout(() => {
      router.push("/admin/caja")
    }, 1500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones básicas
    if (!formData.cliente.nombre || !formData.dispositivo.marca || !formData.dispositivo.problema) {
      toast({
        title: "Campos requeridos",
        description:
          "Por favor complete al menos el nombre del cliente, marca del dispositivo y descripción del problema",
        variant: "destructive",
      })
      return
    }

    setIsRegistering(true)

    try {
      // Preparar los datos para Firebase
      const serviceData = {
        customerName: formData.cliente.nombre,
        customerDNI: formData.cliente.dni,
        phoneNumber: formData.cliente.telefono,
        deviceBrand: formData.dispositivo.marca,
        deviceModel: formData.dispositivo.modelo,
        issueDescription: formData.dispositivo.problema,
        unlockMethod: formData.dispositivo.metodoDesbloqueo,
        devicePassword: formData.dispositivo.metodoDesbloqueo !== "patron" ? formData.dispositivo.contraseña : null,
        patternCode: formData.dispositivo.metodoDesbloqueo === "patron" ? devicePattern : null,
        price: formData.servicio.costo,
        currency: formData.servicio.moneda,
        status: "pending",
        isPaid: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Guardar en Firebase
      console.log("Guardando servicio técnico en Firebase:", serviceData)
      const servicesRef = collection(db, "technicalServices")
      const docRef = await addDoc(servicesRef, serviceData)

      const servicioId = docRef.id.substring(0, 6).toUpperCase()
      console.log("Servicio técnico guardado con ID:", docRef.id)

      // 1. Imprimir ticket del servicio
      imprimirTicketServicio(servicioId)

      // 2. Mostrar confirmación
      toast({
        title: "Servicio registrado",
        description: "El servicio técnico ha sido registrado correctamente en la base de datos",
      })

      // 3. Limpiar formulario
      limpiarFormulario()

      // 4. Preguntar si quiere transferir a caja para cobro
      setTimeout(() => {
        const confirmarCobro = confirm("¿Desea transferir este servicio a la caja para realizar el cobro ahora?")

        if (confirmarCobro) {
          transferirACaja(docRef.id)
        }
      }, 2000)
    } catch (error) {
      console.error("Error al registrar servicio:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el servicio técnico en la base de datos",
        variant: "destructive",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre del Cliente */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Nombre del Cliente
            </Label>
            <Input
              id="nombre"
              value={formData.cliente.nombre}
              onChange={(e) => handleInputChange("cliente", "nombre", e.target.value)}
              placeholder="Nombre completo"
              className="h-12"
              required
            />
          </div>

          {/* DNI del Cliente */}
          <div className="space-y-2">
            <Label htmlFor="dni" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              DNI del Cliente
            </Label>
            <Input
              id="dni"
              value={formData.cliente.dni}
              onChange={(e) => handleInputChange("cliente", "dni", e.target.value)}
              placeholder="Número de documento"
              className="h-12"
            />
          </div>

          {/* Número de Contacto */}
          <div className="space-y-2">
            <Label htmlFor="telefono" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Número de Contacto
            </Label>
            <Input
              id="telefono"
              value={formData.cliente.telefono}
              onChange={(e) => handleInputChange("cliente", "telefono", e.target.value)}
              placeholder="Teléfono"
              className="h-12"
              required
            />
          </div>

          {/* Costo del Servicio */}
          <div className="space-y-2">
            <Label htmlFor="costo" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Costo del Servicio
            </Label>
            <div className="flex">
              <div className="flex items-center bg-gray-50 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md px-3">
                <span className="text-gray-500 dark:text-gray-400">$</span>
              </div>
              <Input
                id="costo"
                type="number"
                step="0.01"
                value={formData.servicio.costo}
                onChange={(e) => handleInputChange("servicio", "costo", Number.parseFloat(e.target.value) || 0)}
                placeholder="Precio (solo para registro)"
                className="h-12 rounded-l-none flex-1"
              />
              <Select
                value={formData.servicio.moneda}
                onValueChange={(value) => handleInputChange("servicio", "moneda", value)}
              >
                <SelectTrigger className="w-24 h-12 rounded-l-none border-l-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monedas.map((moneda) => (
                    <SelectItem key={moneda.value} value={moneda.value}>
                      {moneda.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Marca del Dispositivo */}
          <div className="space-y-2">
            <Label htmlFor="marca" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Marca del Dispositivo
            </Label>
            <Input
              id="marca"
              value={formData.dispositivo.marca}
              onChange={(e) => handleInputChange("dispositivo", "marca", e.target.value)}
              placeholder="Ej: Samsung, Apple, Xiaomi"
              className="h-12"
              required
            />
          </div>

          {/* Modelo */}
          <div className="space-y-2">
            <Label htmlFor="modelo" className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Modelo
            </Label>
            <Input
              id="modelo"
              value={formData.dispositivo.modelo}
              onChange={(e) => handleInputChange("dispositivo", "modelo", e.target.value)}
              placeholder="Ej: iPhone 13, Galaxy S21"
              className="h-12"
            />
          </div>
        </div>

        {/* Método de Desbloqueo */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Método de Desbloqueo</Label>
          <RadioGroup
            value={formData.dispositivo.metodoDesbloqueo}
            onValueChange={(value) => handleInputChange("dispositivo", "metodoDesbloqueo", value)}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="patron" id="patron" />
              <Label htmlFor="patron" className="text-sm text-gray-700 dark:text-gray-300">
                Patrón
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pin" id="pin" />
              <Label htmlFor="pin" className="text-sm text-gray-700 dark:text-gray-300">
                PIN
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="contraseña" id="contraseña" />
              <Label htmlFor="contraseña" className="text-sm text-gray-700 dark:text-gray-300">
                Contraseña
              </Label>
            </div>
          </RadioGroup>

          {/* Campo dinámico según el método seleccionado */}
          {formData.dispositivo.metodoDesbloqueo === "contraseña" && (
            <Input
              value={formData.dispositivo.contraseña}
              onChange={(e) => handleInputChange("dispositivo", "contraseña", e.target.value)}
              placeholder="Ingresa la contraseña del dispositivo"
              className="h-12"
              type="password"
            />
          )}

          {formData.dispositivo.metodoDesbloqueo === "pin" && (
            <Input
              value={formData.dispositivo.contraseña}
              onChange={(e) => handleInputChange("dispositivo", "contraseña", e.target.value)}
              placeholder="Ingresa el PIN del dispositivo"
              className="h-12"
              type="number"
              maxLength={6}
            />
          )}

          {formData.dispositivo.metodoDesbloqueo === "patron" && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Dibuja el patrón de desbloqueo del dispositivo:
              </Label>
              <PatternLock
                onChange={(pattern) => {
                  setDevicePattern(pattern)
                  handleInputChange("dispositivo", "contraseña", pattern.join("-"))
                }}
                className="mx-auto"
              />
              {devicePattern.length > 0 && (
                <p className="text-xs text-gray-500 text-center">Patrón registrado: {devicePattern.join(" → ")}</p>
              )}
            </div>
          )}
        </div>

        {/* Descripción del Problema */}
        <div className="space-y-2">
          <Label htmlFor="problema" className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Descripción del Problema
          </Label>
          <Textarea
            id="problema"
            value={formData.dispositivo.problema}
            onChange={(e) => handleInputChange("dispositivo", "problema", e.target.value)}
            placeholder="Describe el problema del dispositivo"
            className="min-h-[120px] resize-none"
            required
          />
        </div>

        {/* Botones */}
        <div className="flex gap-4 justify-end pt-4">
          <Button type="button" variant="outline" onClick={limpiarFormulario} className="h-12 px-6 bg-transparent">
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpiar formulario
          </Button>
          <Button type="submit" className="h-12 px-6 bg-green-600 hover:bg-green-700" disabled={isRegistering}>
            {isRegistering ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Registrando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Registrar Servicio
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
