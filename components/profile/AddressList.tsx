"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Plus, Trash, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"

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

interface AddressListProps {
  userId: string
}

interface Province {
  id: string
  name: string
}

interface Municipality {
  id: string
  name: string
  provinceId: string
}

interface AddressFormData {
  name: string
  street: string
  number: string
  floor?: string
  apartment?: string
  postalCode: string
  province: string
  municipality: string
  country: string
  isDefault: boolean
}

export default function AddressList({ userId }: AddressListProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<AddressFormData>({
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
  const [provinces, setProvinces] = useState<Province[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [filteredMunicipalities, setFilteredMunicipalities] = useState<Municipality[]>([])
  const { toast } = useToast()
  const { user } = useAuth()

  // Cargar provincias y municipios (datos de ejemplo)
  useEffect(() => {
    // En una aplicación real, estos datos vendrían de una API
    const argProvinces: Province[] = [
      { id: "1", name: "Buenos Aires" },
      { id: "2", name: "Córdoba" },
      { id: "3", name: "Santa Fe" },
      { id: "4", name: "Mendoza" },
      { id: "5", name: "Tucumán" },
    ]

    const argMunicipalities: Municipality[] = [
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
    ]

    setProvinces(argProvinces)
    setMunicipalities(argMunicipalities)
  }, [])

  // Filtrar municipios cuando cambia la provincia
  useEffect(() => {
    if (formData.province) {
      const filtered = municipalities.filter((m) => m.provinceId === formData.province)
      setFilteredMunicipalities(filtered)
    } else {
      setFilteredMunicipalities([])
    }
  }, [formData.province, municipalities])

  // Cargar direcciones desde Firebase
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) {
        setLoading(false)
        return
      }

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
      } catch (error) {
        console.error("Error al cargar direcciones:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las direcciones",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [user, toast])

  // Manejar cambios en el formulario
  const handleChange = (field: keyof AddressFormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Si se cambia la provincia, resetear el municipio
    if (field === "province") {
      setFormData((prev) => ({
        ...prev,
        municipality: "",
      }))
    }
  }

  // Guardar dirección en Firebase
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
      // Validar campos requeridos
      if (
        !formData.name ||
        !formData.street ||
        !formData.number ||
        !formData.postalCode ||
        !formData.province ||
        !formData.municipality
      ) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos obligatorios",
          variant: "destructive",
        })
        return
      }

      // Si es dirección predeterminada, actualizar las demás
      if (formData.isDefault) {
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
      const provinceName = provinces.find((p) => p.id === formData.province)?.name || ""
      const municipalityName = municipalities.find((m) => m.id === formData.municipality)?.name || ""

      // Guardar nueva dirección
      const addressData = {
        userId: user.uid,
        name: formData.name,
        street: formData.street,
        number: formData.number,
        floor: formData.floor || "",
        apartment: formData.apartment || "",
        postalCode: formData.postalCode,
        province: provinceName,
        provinceId: formData.province,
        municipality: municipalityName,
        municipalityId: formData.municipality,
        country: formData.country,
        isDefault: formData.isDefault,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      await addDoc(collection(db, "addresses"), addressData)

      // Actualizar la lista de direcciones
      const newAddress: Address = {
        id: Date.now().toString(), // Temporal hasta que se actualice la lista
        name: formData.name,
        street: `${formData.street} ${formData.number}${formData.floor ? `, Piso ${formData.floor}` : ""}${formData.apartment ? `, Depto ${formData.apartment}` : ""}`,
        city: municipalityName,
        state: provinceName,
        zipCode: formData.postalCode,
        country: formData.country,
        isDefault: formData.isDefault,
      }

      setAddresses((prev) => [...prev, newAddress])

      // Resetear formulario y cerrar diálogo
      setFormData({
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

      setIsDialogOpen(false)

      toast({
        title: "Dirección guardada",
        description: "Tu dirección ha sido guardada correctamente",
      })

      // Recargar direcciones para obtener el ID correcto
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
    } catch (error) {
      console.error("Error al guardar dirección:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la dirección",
        variant: "destructive",
      })
    }
  }

  // Eliminar dirección
  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteDoc(doc(db, "addresses", addressId))
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId))
      toast({
        title: "Dirección eliminada",
        description: "La dirección ha sido eliminada correctamente",
      })
    } catch (error) {
      console.error("Error al eliminar dirección:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la dirección",
        variant: "destructive",
      })
    }
  }

  // Establecer como predeterminada
  const handleSetDefault = async (addressId: string) => {
    try {
      // Primero, quitar predeterminada de todas las direcciones
      const addressesRef = collection(db, "addresses")
      const q = query(addressesRef, where("userId", "==", user?.uid), where("isDefault", "==", true))
      const querySnapshot = await getDocs(q)

      const batch = []
      querySnapshot.forEach((document) => {
        batch.push(
          updateDoc(doc(db, "addresses", document.id), {
            isDefault: false,
          }),
        )
      })

      await Promise.all(batch)

      // Establecer la nueva dirección predeterminada
      await updateDoc(doc(db, "addresses", addressId), {
        isDefault: true,
      })

      // Actualizar estado local
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === addressId,
        })),
      )

      toast({
        title: "Dirección predeterminada",
        description: "La dirección ha sido establecida como predeterminada",
      })
    } catch (error) {
      console.error("Error al establecer dirección predeterminada:", error)
      toast({
        title: "Error",
        description: "No se pudo establecer la dirección como predeterminada",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Mis Direcciones
          </CardTitle>
          <CardDescription>Gestiona tus direcciones de envío</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex justify-center items-center py-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="px-8 py-6 text-base font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Añadir dirección
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Añadir nueva dirección</DialogTitle>
              <DialogDescription>Completa el formulario para añadir una nueva dirección de envío.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  placeholder="Casa, Trabajo, etc."
                  className="col-span-3"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
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
                  value={formData.street}
                  onChange={(e) => handleChange("street", e.target.value)}
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
                  value={formData.number}
                  onChange={(e) => handleChange("number", e.target.value)}
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
                  value={formData.floor}
                  onChange={(e) => handleChange("floor", e.target.value)}
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
                  value={formData.apartment}
                  onChange={(e) => handleChange("apartment", e.target.value)}
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
                  value={formData.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="country" className="text-right">
                  País
                </Label>
                <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
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
                <Select value={formData.province} onValueChange={(value) => handleChange("province", value)}>
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
                  value={formData.municipality}
                  onValueChange={(value) => handleChange("municipality", value)}
                  disabled={!formData.province}
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
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => handleChange("isDefault", checked)}
                  />
                  <Label htmlFor="isDefault">Establecer como dirección predeterminada</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSaveAddress}>
                Guardar dirección
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addresses.length > 0 ? (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`border rounded-lg p-4 hover:border-primary transition-colors ${address.isDefault ? "border-primary bg-primary/5" : ""}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div
                      className={`p-1.5 rounded-full mr-2 ${address.isDefault ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      {address.isDefault ? <Check className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{address.name}</p>
                      {address.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Predeterminada
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!address.isDefault && (
                      <Button variant="outline" size="sm" onClick={() => handleSetDefault(address.id)}>
                        Predeterminada
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{address.street}</p>
                  <p>
                    {address.city}, {address.state} {address.zipCode}
                  </p>
                  <p>{address.country}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto py-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 dark:bg-gray-800">
                <MapPin className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tienes direcciones guardadas</h3>
              <p className="text-muted-foreground mb-4">Añade una dirección para agilizar tus compras</p>
            </div>

            <div className="border rounded-lg p-6 bg-card">
              <h3 className="text-lg font-medium mb-4">Nueva dirección</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Casa, Trabajo, etc."
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="street">Calle</Label>
                  <Input
                    id="street"
                    placeholder="Nombre de la calle"
                    value={formData.street}
                    onChange={(e) => handleChange("street", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    placeholder="123"
                    value={formData.number}
                    onChange={(e) => handleChange("number", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="floor">Piso</Label>
                    <Input
                      id="floor"
                      placeholder="Opcional"
                      value={formData.floor}
                      onChange={(e) => handleChange("floor", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="apartment">Departamento</Label>
                    <Input
                      id="apartment"
                      placeholder="Opcional"
                      value={formData.apartment}
                      onChange={(e) => handleChange("apartment", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postalCode">Código Postal</Label>
                  <Input
                    id="postalCode"
                    placeholder="A1234BCD"
                    value={formData.postalCode}
                    onChange={(e) => handleChange("postalCode", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">País</Label>
                  <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Argentina">Argentina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Select value={formData.province} onValueChange={(value) => handleChange("province", value)}>
                    <SelectTrigger>
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
                <div className="grid gap-2">
                  <Label htmlFor="municipality">Municipio</Label>
                  <Select
                    value={formData.municipality}
                    onValueChange={(value) => handleChange("municipality", value)}
                    disabled={!formData.province}
                  >
                    <SelectTrigger>
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
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => handleChange("isDefault", checked)}
                  />
                  <Label htmlFor="isDefault">Establecer como dirección predeterminada</Label>
                </div>
                <Button className="mt-4 w-full" onClick={handleSaveAddress}>
                  Guardar dirección
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
