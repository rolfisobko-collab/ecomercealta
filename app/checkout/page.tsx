"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  MapPin,
  CreditCard,
  Truck,
  ArrowLeft,
  Check,
  Upload,
  Copy,
  Wallet,
  User,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchExchangeRate } from "@/utils/currencyUtils"

interface Address {
  id: string
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  requiresProof: boolean
  instructions: string
  accountDetails?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const pathname = usePathname()
  const inGremio = pathname?.startsWith("/gremio")
  const { user } = useAuth()
  const { items, totalPrice, clearCart } = useCart()
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const [transactionHash, setTransactionHash] = useState<string>("")
  const [transferDetails, setTransferDetails] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [recipientInfo, setRecipientInfo] = useState({
    name: "",
    documentId: "",
    phone: "",
  })
  const [loadingUserProfile, setLoadingUserProfile] = useState(true)
  const [saveProfileChanges, setSaveProfileChanges] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [addressFormData, setAddressFormData] = useState({
    name: "",
    street: "",
    number: "",
    floor: "",
    apartment: "",
    postalCode: "",
    province: "",
    municipality: "",
    country: "Argentina",
    isDefault: false,
  })
  const [provinces, setProvinces] = useState([
    { id: "1", name: "Buenos Aires" },
    { id: "2", name: "Córdoba" },
    { id: "3", name: "Santa Fe" },
    { id: "4", name: "Mendoza" },
    { id: "5", name: "Tucumán" },
  ])
  const [municipalities, setMunicipalities] = useState([
    // Buenos Aires
    { id: "101", name: "La Plata", provinceId: "1" },
    { id: "102", name: "Mar del Plata", provinceId: "1" },
    { id: "103", name: "Bahía Blanca", provinceId: "1" },
    // Córdoba
    { id: "201", name: "Córdoba Capital", provinceId: "2" },
    { id: "202", name: "Villa María", provinceId: "2" },
    { id: "203", name: "Río Cuarto", provinceId: "2" },
    // Santa Fe
    { id: "301", name: "Rosario", provinceId: "3" },
    { id: "302", name: "Santa Fe Capital", provinceId: "3" },
    { id: "303", name: "Venado Tuerto", provinceId: "3" },
    // Mendoza
    { id: "401", name: "Mendoza Capital", provinceId: "4" },
    { id: "402", name: "San Rafael", provinceId: "4" },
    { id: "403", name: "Godoy Cruz", provinceId: "4" },
    // Tucumán
    { id: "501", name: "San Miguel de Tucumán", provinceId: "5" },
    { id: "502", name: "Yerba Buena", provinceId: "5" },
    { id: "503", name: "Tafí Viejo", provinceId: "5" },
  ])
  const [filteredMunicipalities, setFilteredMunicipalities] = useState([])
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [selectedAddressDetails, setSelectedAddressDetails] = useState<Address | null>(null)
  const [orderCompleted, setOrderCompleted] = useState(false)
  const [exchangeRate, setExchangeRate] = useState<number>(1100)
  const [validationOpen, setValidationOpen] = useState(false)
  const [validationIssues, setValidationIssues] = useState<string[]>([])

  const paymentMethods: PaymentMethod[] = [
    {
      id: "transfer",
      name: "Transferencia Bancaria",
      description: "Realiza una transferencia a nuestra cuenta bancaria",
      icon: <CreditCard className="h-5 w-5" />,
      requiresProof: true,
      instructions: "Realiza la transferencia a la cuenta bancaria indicada y sube el comprobante.",
      accountDetails:
        "Banco: Personal Pay\nTitular: Liliana De Sousa Bueno\nCuenta: Digital\nCBU: 0000076500000028217943\nAlias: Alta.324\nCUIT: 23306387944",
    },
    {
      id: "usdt",
      name: "USDT (Tether)",
      description: "Paga con criptomonedas USDT",
      icon: <Wallet className="h-5 w-5" />,
      requiresProof: false,
      instructions: "Envía USDT a la dirección proporcionada y comparte el hash de la transacción.",
      accountDetails: "Dirección USDT (TRC20): TEK3ZHbDGpAMCB1Tnp6jL5kqZVCmG16rci",
    },
    {
      id: "cod",
      name: "Contra Entrega",
      description: "Paga cuando recibas tu pedido",
      icon: <Truck className="h-5 w-5" />,
      requiresProof: false,
      instructions: "Pagarás el monto total cuando recibas tu pedido. Asegúrate de tener el importe exacto.",
    },
  ]

  useEffect(() => {
    if (items.length === 0 && !orderCompleted) {
      router.push(inGremio ? "/gremio/cart" : "/cart")
      return
    }

    if (!user) {
      router.push(inGremio ? "/auth/login?redirect=/gremio/checkout" : "/auth/login?redirect=/checkout")
      return
    }

    const fetchAddresses = async () => {
      try {
        const addressesRef = collection(db, "addresses")
        const q = query(addressesRef, where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)

        const addressesData: Address[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          addressesData.push({
            id: doc.id,
            name: data.name || "",
            street: `${data.street} ${data.number}${data.floor ? `, Piso ${data.floor}` : ""}${data.apartment ? `, Depto ${data.apartment}` : ""}`,
            city: data.municipality || "",
            state: data.province || "",
            zipCode: data.postalCode || "",
            country: data.country || "Argentina",
            isDefault: data.isDefault || false,
          })
        })

        setAddresses(addressesData)

        // Seleccionar dirección predeterminada si existe
        const defaultAddress = addressesData.find((addr) => addr.isDefault)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
          setSelectedAddressDetails(defaultAddress)
        } else if (addressesData.length > 0) {
          setSelectedAddressId(addressesData[0].id)
          setSelectedAddressDetails(addressesData[0])
        }
      } catch (error) {
        console.error("Error al cargar direcciones:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las direcciones",
          variant: "destructive",
        })
      } finally {
        setLoadingAddresses(false)
      }
    }

    fetchAddresses()
    loadUserProfile() // Cargar el perfil del usuario
  }, [user, router, items.length, toast, orderCompleted, inGremio])

  useEffect(() => {
    const getExchangeRate = async () => {
      try {
        const rate = await fetchExchangeRate()
        if (rate) {
          setExchangeRate(rate)
        }
      } catch (error) {
        console.error("Error al obtener la tasa de cambio:", error)
      }
    }

    getExchangeRate()
  }, [])

  // Actualizar los detalles de la dirección seleccionada cuando cambia la selección
  useEffect(() => {
    if (selectedAddressId && addresses.length > 0) {
      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId)
      if (selectedAddress) {
        setSelectedAddressDetails(selectedAddress)
      }
    }
  }, [selectedAddressId, addresses])

  const validateCheckout = () => {
    const issues: string[] = []
    if (!selectedAddressId) issues.push('Seleccioná una dirección de envío')
    if (!selectedPaymentMethod) issues.push('Seleccioná un método de pago')
    if (!recipientInfo.name) issues.push('Ingresá el nombre del destinatario')
    if (!recipientInfo.documentId) issues.push('Ingresá el documento del destinatario')
    if (!recipientInfo.phone) issues.push('Ingresá el teléfono de contacto')
    // Validación específica para métodos que requieren comprobante
    const pm = paymentMethods.find(p => p.id === selectedPaymentMethod)
    if (pm?.requiresProof && !proofFile && !transactionHash) {
      issues.push('Adjuntá el comprobante o el hash de la transacción del pago')
    }
    return issues
  }

  const handleSafeSubmit = async () => {
    if (isSubmitting) return
    const issues = validateCheckout()
    if (issues.length > 0) {
      setValidationIssues(issues)
      setValidationOpen(true)
      return
    }
    await handleSubmitOrder()
  }

  // Filtrar municipios cuando cambia la provincia
  useEffect(() => {
    if (addressFormData.province) {
      const filtered = municipalities.filter((m) => m.provinceId === addressFormData.province)
      setFilteredMunicipalities(filtered)
    } else {
      setFilteredMunicipalities([])
    }
  }, [addressFormData.province, municipalities])

  const handleAddressFormChange = (field, value) => {
    setAddressFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Si se cambia la provincia, resetear el municipio
    if (field === "province") {
      setAddressFormData((prev) => ({
        ...prev,
        municipality: "",
      }))
    }
  }

  const handleSaveAddress = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar direcciones",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSavingAddress(true)

      // Validar campos requeridos
      if (
        !addressFormData.name ||
        !addressFormData.street ||
        !addressFormData.number ||
        !addressFormData.postalCode ||
        !addressFormData.province ||
        !addressFormData.municipality
      ) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos obligatorios",
          variant: "destructive",
        })
        setIsSavingAddress(false)
        return
      }

      // Si es dirección predeterminada, actualizar las demás
      if (addressFormData.isDefault) {
        const addressesRef = collection(db, "addresses")
        const q = query(addressesRef, where("userId", "==", user.uid), where("isDefault", "==", true))
        const querySnapshot = await getDocs(q)

        // Actualizar todas las direcciones predeterminadas existentes
        const batch = []
        querySnapshot.forEach((document) => {
          batch.push(
            updateDoc(doc(db, "addresses", document.id), {
              isDefault: false,
            }),
          )
        })

        await Promise.all(batch)
      }

      // Obtener nombre de provincia y municipio
      const provinceName = provinces.find((p) => p.id === addressFormData.province)?.name || ""
      const municipalityName = municipalities.find((m) => m.id === addressFormData.municipality)?.name || ""

      // Guardar nueva dirección
      const addressData = {
        userId: user.uid,
        name: addressFormData.name,
        street: addressFormData.street,
        number: addressFormData.number,
        floor: addressFormData.floor || "",
        apartment: addressFormData.apartment || "",
        postalCode: addressFormData.postalCode,
        province: provinceName,
        provinceId: addressFormData.province,
        municipality: municipalityName,
        municipalityId: addressFormData.municipality,
        country: addressFormData.country,
        isDefault: addressFormData.isDefault,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      const docRef = await addDoc(collection(db, "addresses"), addressData)

      // Crear objeto de dirección para la UI
      const newAddress = {
        id: docRef.id,
        name: addressFormData.name,
        street: `${addressFormData.street} ${addressFormData.number}${addressFormData.floor ? `, Piso ${addressFormData.floor}` : ""}${addressFormData.apartment ? `, Depto ${addressFormData.apartment}` : ""}`,
        city: municipalityName,
        state: provinceName,
        zipCode: addressFormData.postalCode,
        country: addressFormData.country,
        isDefault: addressFormData.isDefault,
      }

      // Actualizar la lista de direcciones
      setAddresses((prev) => [...prev, newAddress])

      // Seleccionar la nueva dirección
      setSelectedAddressId(docRef.id)
      setSelectedAddressDetails(newAddress)

      // Resetear formulario y cerrar diálogo
      setAddressFormData({
        name: "",
        street: "",
        number: "",
        floor: "",
        apartment: "",
        postalCode: "",
        province: "",
        municipality: "",
        country: "Argentina",
        isDefault: false,
      })

      setIsAddressDialogOpen(false)

      toast({
        title: "Dirección guardada",
        description: "Tu dirección ha sido guardada correctamente",
      })
    } catch (error) {
      console.error("Error al guardar dirección:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la dirección",
        variant: "destructive",
      })
    } finally {
      setIsSavingAddress(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProofFile(file)

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setProofPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const loadUserProfile = async () => {
    if (!user) return

    try {
      setLoadingUserProfile(true)
      const userDocRef = doc(db, "userProfiles", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        setRecipientInfo({
          name: userData.displayName || user.displayName || "",
          documentId: userData.documentId || "",
          phone: userData.phoneNumber || user.phoneNumber || "",
        })
      } else {
        // Si no hay perfil, usar datos básicos del auth
        setRecipientInfo({
          name: user.displayName || "",
          documentId: "",
          phone: user.phoneNumber || "",
        })
      }
    } catch (error) {
      console.error("Error al cargar perfil de usuario:", error)
    } finally {
      setLoadingUserProfile(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado al portapapeles",
      description: "La información ha sido copiada",
    })
  }

  const copyPaymentData = () => {
    if (selectedMethod?.id === "transfer") {
      // Copiar CBU para transferencia bancaria
      const cbu = "0000076500000028217943"
      navigator.clipboard.writeText(cbu)
      toast({
        title: "CBU copiado",
        description: "El CBU ha sido copiado al portapapeles",
      })
    } else if (selectedMethod?.id === "usdt") {
      // Copiar dirección de wallet USDT
      const usdtAddress = "TEK3ZHbDGpAMCB1Tnp6jL5kqZVCmG16rci"
      navigator.clipboard.writeText(usdtAddress)
      toast({
        title: "Dirección USDT copiada",
        description: "La dirección de la wallet USDT ha sido copiada al portapapeles",
      })
    } else {
      // Copiar todos los datos si no es ninguno de los anteriores
      navigator.clipboard.writeText(selectedMethod?.accountDetails || "")
      toast({
        title: "Copiado al portapapeles",
        description: "La información ha sido copiada",
      })
    }
  }

  const updateUserProfile = async () => {
    if (!user) return

    try {
      setIsUpdatingProfile(true)

      const userDocRef = doc(db, "userProfiles", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        // Actualizar documento existente
        await updateDoc(userDocRef, {
          displayName: recipientInfo.name,
          documentId: recipientInfo.documentId,
          phoneNumber: recipientInfo.phone,
          updatedAt: Timestamp.now(),
        })
      } else {
        // Crear nuevo documento
        await setDoc(userDocRef, {
          displayName: recipientInfo.name,
          documentId: recipientInfo.documentId,
          phoneNumber: recipientInfo.phone,
          email: user.email,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu información personal ha sido actualizada correctamente",
      })
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar tu información personal",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleSubmitOrder = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para completar la compra",
        variant: "destructive",
      })
      return
    }

    if (!selectedAddressId || !selectedAddressDetails) {
      toast({
        title: "Error",
        description: "Selecciona una dirección de envío",
        variant: "destructive",
      })
      return
    }

    if (!selectedPaymentMethod) {
      toast({
        title: "Error",
        description: "Selecciona un método de pago",
        variant: "destructive",
      })
      return
    }

    // Validar comprobante para métodos que lo requieren
    const selectedMethod = paymentMethods.find((method) => method.id === selectedPaymentMethod)
    if (selectedMethod?.requiresProof && !proofFile && selectedMethod.id === "transfer") {
      toast({
        title: "Error",
        description: "Debes subir un comprobante de pago",
        variant: "destructive",
      })
      return
    }

    if (selectedMethod?.id === "usdt" && !transactionHash) {
      toast({
        title: "Error",
        description: "Debes proporcionar el hash de la transacción",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Crear objeto de orden con información completa
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          subtotal: item.product.price * item.quantity,
          image:
            item.product.image1 ||
            (item.product.images && item.product.images.length > 0 ? item.product.images[0] : null),
        })),
        // Guardar ID y detalles completos de la dirección
        addressId: selectedAddressId,
        shippingAddress: {
          id: selectedAddressDetails.id,
          name: selectedAddressDetails.name,
          street: selectedAddressDetails.street,
          city: selectedAddressDetails.city,
          state: selectedAddressDetails.state,
          zipCode: selectedAddressDetails.zipCode,
          country: selectedAddressDetails.country,
        },
        // Información del destinatario
        recipientInfo: {
          name: recipientInfo.name,
          documentId: recipientInfo.documentId,
          phone: recipientInfo.phone,
        },
        // Información para el panel de administración
        customer: recipientInfo.name, // Para compatibilidad con la vista de admin
        email: user.email,
        paymentMethod: selectedPaymentMethod,
        paymentMethodName: paymentMethods.find((m) => m.id === selectedPaymentMethod)?.name || selectedPaymentMethod,
        totalAmount: totalPrice,
        subtotal: totalPrice,
        shippingCost: 0, // Envío gratis
        taxAmount: 0, // Sin impuestos adicionales
        status: selectedPaymentMethod === "cod" ? "pending" : "processing",
        paymentStatus: selectedPaymentMethod === "cod" ? "pending" : "pending_verification",
        notes: notes,
        date: new Date().toISOString().split("T")[0], // Para compatibilidad con la vista de admin
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        total: totalPrice, // Campo adicional para compatibilidad con la interfaz Order
      }

      // Añadir detalles específicos según método de pago
      if (selectedPaymentMethod === "transfer") {
        orderData.transferDetails = transferDetails
        // Aquí se manejaría la subida del comprobante a Firebase Storage
      } else if (selectedPaymentMethod === "usdt") {
        orderData.transactionHash = transactionHash
      }

      // Guardar orden en Firestore
      const orderRef = await addDoc(collection(db, "orders"), orderData)

      // Actualizar perfil si está marcada la opción
      if (saveProfileChanges) {
        try {
          const userDocRef = doc(db, "userProfiles", user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            await updateDoc(userDocRef, {
              displayName: recipientInfo.name,
              documentId: recipientInfo.documentId,
              phoneNumber: recipientInfo.phone,
              updatedAt: Timestamp.now(),
            })
          } else {
            await setDoc(userDocRef, {
              displayName: recipientInfo.name,
              documentId: recipientInfo.documentId,
              phoneNumber: recipientInfo.phone,
              email: user.email,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            })
          }
        } catch (error) {
          console.error("Error al actualizar perfil durante checkout:", error)
          // No interrumpimos el flujo de checkout si falla la actualización del perfil
        }
      }

      // Marcar que se ha completado una orden antes de limpiar el carrito
      setOrderCompleted(true)

      // Limpiar carrito
      clearCart()

      // Mostrar confirmación
      toast({
        title: "¡Pedido realizado!",
        description: `Tu pedido #${orderRef.id.substring(0, 8)} ha sido registrado correctamente.`,
      })

      // Redirigir a página de confirmación de pedido
      setTimeout(() => {
        router.push(`/order-confirmation/${orderRef.id}`)
      }, 500)
    } catch (error) {
      console.error("Error al procesar el pedido:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar el pedido. Inténtalo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedMethod = paymentMethods.find((method) => method.id === selectedPaymentMethod)

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mr-4 self-start mb-4 sm:mb-0 hover:scale-105 transition-transform"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
            Finalizar Compra
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Completa tu información para procesar el pedido</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="mb-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 rounded-t-lg">
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-red-500" />
                Dirección de Envío
              </CardTitle>
              <CardDescription>Selecciona dónde quieres recibir tu pedido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  Selecciona una dirección existente o añade una nueva
                </div>
                <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Añadir dirección
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Añadir nueva dirección</DialogTitle>
                      <DialogDescription>
                        Completa el formulario para añadir una nueva dirección de envío.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 overflow-y-auto pr-1">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Nombre
                        </Label>
                        <Input
                          id="name"
                          placeholder="Casa, Trabajo, etc."
                          className="col-span-3"
                          value={addressFormData.name}
                          onChange={(e) => handleAddressFormChange("name", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="street" className="text-right">
                          Calle
                        </Label>
                        <Input
                          id="street"
                          placeholder="Nombre de la calle"
                          className="col-span-3"
                          value={addressFormData.street}
                          onChange={(e) => handleAddressFormChange("street", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="number" className="text-right">
                          Número
                        </Label>
                        <Input
                          id="number"
                          placeholder="123"
                          className="col-span-3"
                          value={addressFormData.number}
                          onChange={(e) => handleAddressFormChange("number", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="floor" className="text-right">
                          Piso
                        </Label>
                        <Input
                          id="floor"
                          placeholder="Opcional"
                          className="col-span-3"
                          value={addressFormData.floor}
                          onChange={(e) => handleAddressFormChange("floor", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="apartment" className="text-right">
                          Departamento
                        </Label>
                        <Input
                          id="apartment"
                          placeholder="Opcional"
                          className="col-span-3"
                          value={addressFormData.apartment}
                          onChange={(e) => handleAddressFormChange("apartment", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="postalCode" className="text-right">
                          Código Postal
                        </Label>
                        <Input
                          id="postalCode"
                          placeholder="A1234BCD"
                          className="col-span-3"
                          value={addressFormData.postalCode}
                          onChange={(e) => handleAddressFormChange("postalCode", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="country" className="text-right">
                          País
                        </Label>
                        <Select
                          value={addressFormData.country}
                          onValueChange={(value) => handleAddressFormChange("country", value)}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecciona un país" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Argentina">Argentina</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="province" className="text-right">
                          Provincia
                        </Label>
                        <Select
                          value={addressFormData.province}
                          onValueChange={(value) => handleAddressFormChange("province", value)}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecciona una provincia" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map((province) => (
                              <SelectItem key={province.id} value={province.id}>
                                {province.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="municipality" className="text-right">
                          Municipio
                        </Label>
                        <Select
                          value={addressFormData.municipality}
                          onValueChange={(value) => handleAddressFormChange("municipality", value)}
                          disabled={!addressFormData.province}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecciona un municipio" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredMunicipalities.map((municipality) => (
                              <SelectItem key={municipality.id} value={municipality.id}>
                                {municipality.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="isDefault" className="text-right">
                          Predeterminada
                        </Label>
                        <div className="flex items-center space-x-2 col-span-3">
                          <Switch
                            id="isDefault"
                            checked={addressFormData.isDefault}
                            onCheckedChange={(checked) => handleAddressFormChange("isDefault", checked)}
                          />
                          <Label htmlFor="isDefault">Establecer como dirección predeterminada</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="flex-shrink-0 pt-2">
                      <Button type="submit" onClick={handleSaveAddress} disabled={isSavingAddress}>
                        {isSavingAddress ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          "Guardar dirección"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {loadingAddresses ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : addresses.length > 0 ? (
                <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="flex items-start space-x-3">
                      <RadioGroupItem value={address.id} id={`address-${address.id}`} className="mt-1" />
                      <div className="w-full cursor-pointer rounded-lg border p-4 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors">
                        <Label
                          htmlFor={`address-${address.id}`}
                          className="flex cursor-pointer justify-between font-medium"
                        >
                          <span>{address.name}</span>
                          {address.isDefault && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              Predeterminada
                            </span>
                          )}
                        </Label>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>{address.street}</p>
                          <p>
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                          <p>{address.country}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg border-gray-300 dark:border-gray-700">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                    <MapPin className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No tienes direcciones guardadas</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Añade una dirección para completar tu compra y recibir tus productos
                  </p>
                  <Button
                    onClick={() => setIsAddressDialogOpen(true)}
                    className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir dirección
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 rounded-t-lg">
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-red-500" />
                Información del Destinatario
              </CardTitle>
              <CardDescription>Datos de la persona que recibirá el pedido</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUserProfile ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipientName">Nombre completo</Label>
                    <Input
                      id="recipientName"
                      value={recipientInfo.name}
                      onChange={(e) => setRecipientInfo({ ...recipientInfo, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientDocument">DNI/Documento de identidad</Label>
                    <Input
                      id="recipientDocument"
                      value={recipientInfo.documentId}
                      onChange={(e) => setRecipientInfo({ ...recipientInfo, documentId: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientPhone">Teléfono de contacto</Label>
                    <Input
                      id="recipientPhone"
                      value={recipientInfo.phone}
                      onChange={(e) => setRecipientInfo({ ...recipientInfo, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="saveProfileInfo"
                      checked={saveProfileChanges}
                      onCheckedChange={(checked) => setSaveProfileChanges(checked === true)}
                    />
                    <Label htmlFor="saveProfileInfo" className="text-sm cursor-pointer">
                      Guardar estos datos en mi perfil
                    </Label>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={updateUserProfile}
                      disabled={isUpdatingProfile}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-950/20 transition-colors"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <span className="mr-2">Guardando...</span>
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Actualizar mi perfil
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Esta información se utilizará para la entrega del pedido.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 rounded-t-lg">
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-red-500" />
                Método de Pago
              </CardTitle>
              <CardDescription>Selecciona cómo quieres pagar tu pedido</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-start space-x-3">
                    <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="mt-1" />
                    <div className="w-full cursor-pointer rounded-lg border p-4 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors">
                      <Label htmlFor={`payment-${method.id}`} className="flex cursor-pointer items-center font-medium">
                        <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          {method.icon}
                        </span>
                        {method.name}
                      </Label>
                      <p className="mt-2 text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {selectedMethod && (
                <div className="mt-6 rounded-lg border p-4">
                  <h3 className="mb-2 font-medium">Instrucciones</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{selectedMethod.instructions}</p>

                  {selectedMethod.accountDetails && (
                    <div className="mb-4 rounded-lg bg-muted p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium">Datos de la cuenta</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors"
                          onClick={copyPaymentData}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="whitespace-pre-wrap text-xs">{selectedMethod.accountDetails}</pre>

                      {selectedMethod.id === "usdt" && (
                        <div className="mt-4 flex flex-col items-center">
                          <div className="bg-white p-2 rounded-lg">
                            <img
                              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-16%20at%206.08.56%20PM-4n9RAyFrr63C5o1HcmWJs1NtJaMXNt.jpeg"
                              alt="USDT Wallet QR Code"
                              className="w-40 h-40 object-contain"
                            />
                          </div>
                          <p className="text-xs text-center mt-2">Escanea este código QR para copiar la dirección</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedMethod.id === "transfer" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="transferDetails">Detalles de la transferencia</Label>
                        <Textarea
                          id="transferDetails"
                          placeholder="Ingresa los detalles de tu transferencia (fecha, hora, número de operación, etc.)"
                          value={transferDetails}
                          onChange={(e) => setTransferDetails(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="proofFile">Comprobante de pago</Label>
                        <div className="mt-1 flex items-center">
                          <Input
                            id="proofFile"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <Label
                            htmlFor="proofFile"
                            className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors"
                          >
                            {proofPreview ? (
                              <img
                                src={proofPreview || "/placeholder.svg"}
                                alt="Comprobante"
                                className="h-full w-full rounded-lg object-contain p-2"
                              />
                            ) : (
                              <>
                                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  Haz clic para subir o arrastra y suelta
                                </span>
                                <span className="text-xs text-muted-foreground">PNG, JPG, PDF (máx. 5MB)</span>
                              </>
                            )}
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMethod.id === "usdt" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="transactionHash">Hash de la transacción</Label>
                        <Input
                          id="transactionHash"
                          placeholder="Ingresa el hash de la transacción USDT"
                          value={transactionHash}
                          onChange={(e) => setTransactionHash(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 rounded-t-lg">
              <CardTitle className="text-xl">Resumen del Pedido</CardTitle>
              <CardDescription>{items.reduce((count, item) => count + item.quantity, 0)} artículos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-start justify-between group">
                    <div className="flex items-start space-x-3">
                      <div className="h-16 w-16 overflow-hidden rounded-md border group-hover:border-red-300 transition-colors">
                        <img
                          src={
                            item.product.image1 ||
                            (item.product.images && item.product.images.length > 0
                              ? item.product.images[0]
                              : `/placeholder.svg?height=64&width=64`)
                          }
                          alt={item.product.name}
                          className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-red-600 transition-colors">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">
                      {(item.product.price * item.quantity).toFixed(2)} {item.product.currency}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <p>Subtotal</p>
                  <p>{totalPrice.toFixed(2)} USD</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p>Envío</p>
                  <p>Gratis</p>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium text-lg">
                  <p>Total</p>
                  <p className="text-red-600 dark:text-red-400">
                    {totalPrice.toFixed(2)} USD{" "}
                    {totalPrice > 0 && (
                      <span className="text-sm text-gray-500 ml-1">
                        ({new Intl.NumberFormat("es-AR").format(Math.round(totalPrice * exchangeRate))} ARS)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Instrucciones especiales para la entrega, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {(!recipientInfo.name || !recipientInfo.documentId || !recipientInfo.phone) && (
                <Alert variant="warning" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Información incompleta</AlertTitle>
                  <AlertDescription>
                    Completa todos los datos del destinatario para poder procesar el pedido correctamente.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 transition-all hover:shadow-lg"
                onClick={handleSafeSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando pedido...
                  </>
                ) : (
                  <>
                    Confirmar y Finalizar Compra
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Dialog open={validationOpen} onOpenChange={setValidationOpen}>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle>Faltan datos para continuar</DialogTitle>
                    <DialogDescription>
                      Revisá los siguientes campos obligatorios antes de finalizar la compra.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    {validationIssues.map((msg, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <span>{msg}</span>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setValidationOpen(false)} className="bg-red-600 hover:bg-red-700">Entendido</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <p className="text-xs text-center text-muted-foreground">
                Al confirmar el pedido, aceptas nuestros términos y condiciones y política de privacidad. Toda la
                información proporcionada será utilizada exclusivamente para el procesamiento y entrega de tu pedido.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
