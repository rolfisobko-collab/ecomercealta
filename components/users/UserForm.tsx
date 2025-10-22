"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { collection, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

// Definir la interfaz User con permisos
interface User {
  id: string
  name: string
  username: string
  password?: string
  role: string
  active: boolean
  permissions: UserPermissions
  createdAt: Date
}

interface UserPermissions {
  dashboard: boolean
  ventas: boolean
  caja: boolean
  deposito: boolean
  balances: boolean
  serviciotec: boolean
  registros: boolean
  deudas: boolean
  products: boolean
  categories: boolean
  suppliers: boolean
  purchases: boolean
  orders: boolean
  users: boolean
}

// Permisos por defecto (TODOS habilitados)
const DEFAULT_PERMISSIONS: UserPermissions = {
  dashboard: true,
  ventas: true,
  caja: true,
  deposito: true,
  balances: true,
  serviciotec: true,
  registros: true,
  deudas: true,
  products: true,
  categories: true,
  suppliers: true,
  purchases: true,
  orders: true,
  users: true,
}

// Esquema de validación
const userSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  username: z.string().min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }).optional(),
  role: z.enum(["admin", "tecnico", "gerente", "marketing"]),
  active: z.boolean().default(true),
  permissions: z.object({
    dashboard: z.boolean().default(true),
    ventas: z.boolean().default(true),
    caja: z.boolean().default(true),
    deposito: z.boolean().default(true),
    balances: z.boolean().default(true),
    serviciotec: z.boolean().default(true),
    registros: z.boolean().default(true),
    deudas: z.boolean().default(true),
    products: z.boolean().default(true),
    categories: z.boolean().default(true),
    suppliers: z.boolean().default(true),
    purchases: z.boolean().default(true),
    orders: z.boolean().default(true),
    users: z.boolean().default(true),
  }),
})

type UserFormValues = z.infer<typeof userSchema>

interface UserFormProps {
  user?: User
  onSuccess: () => void
}

// Configuración de permisos por sección
const permissionSections = [
  {
    title: "Principal",
    permissions: [
      { key: "dashboard" as keyof UserPermissions, label: "Dashboard", description: "Acceso al panel principal" },
      { key: "ventas" as keyof UserPermissions, label: "Ventas", description: "Sistema de punto de venta" },
      { key: "caja" as keyof UserPermissions, label: "Caja", description: "Gestión de caja y efectivo" },
      { key: "deposito" as keyof UserPermissions, label: "Depósito", description: "Control de inventario" },
      { key: "balances" as keyof UserPermissions, label: "Balances", description: "Balances financieros" },
      {
        key: "serviciotec" as keyof UserPermissions,
        label: "Servicio Técnico",
        description: "Gestión de servicios técnicos",
      },
    ],
  },
  {
    title: "Transacciones",
    permissions: [
      { key: "registros" as keyof UserPermissions, label: "Registros", description: "Historial de transacciones" },
      { key: "deudas" as keyof UserPermissions, label: "Deudas", description: "Gestión de deudas y créditos" },
    ],
  },
  {
    title: "Inventario",
    permissions: [
      { key: "products" as keyof UserPermissions, label: "Productos", description: "Catálogo de productos" },
      { key: "categories" as keyof UserPermissions, label: "Categorías", description: "Categorías de productos" },
      { key: "suppliers" as keyof UserPermissions, label: "Proveedores", description: "Gestión de proveedores" },
      { key: "purchases" as keyof UserPermissions, label: "Movimientos", description: "Movimientos de inventario" },
    ],
  },
  {
    title: "Administración",
    permissions: [
      { key: "orders" as keyof UserPermissions, label: "Pedidos", description: "Gestión de pedidos" },
      { key: "users" as keyof UserPermissions, label: "Usuarios", description: "Administración de usuarios" },
    ],
  },
]

export function UserForm({ user, onSuccess }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!user

  // Asegurar que los permisos del usuario existente tengan todos los valores por defecto
  const userPermissions = user?.permissions ? { ...DEFAULT_PERMISSIONS, ...user.permissions } : DEFAULT_PERMISSIONS

  // Configurar el formulario
  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      isEditing
        ? userSchema.partial({ password: true }) // Contraseña opcional al editar
        : userSchema, // Contraseña requerida al crear
    ),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      password: "",
      role: user?.role || "tecnico",
      active: user?.active !== undefined ? user.active : true,
      permissions: userPermissions,
    },
  })

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true)
    try {
      // Asegurar que los permisos tengan todos los valores por defecto
      const permissionsWithDefaults = { ...DEFAULT_PERMISSIONS, ...data.permissions }

      if (isEditing && user) {
        // Actualizar usuario existente
        const userRef = doc(db, "internalUsers", user.id)
        const updateData: any = {
          name: data.name,
          username: data.username,
          role: data.role,
          active: data.active,
          permissions: permissionsWithDefaults,
          updatedAt: Timestamp.fromDate(new Date()),
        }

        // Solo actualizar la contraseña si se proporciona una nueva
        if (data.password) {
          updateData.password = data.password
        }

        await updateDoc(userRef, updateData)
        toast.success("Usuario actualizado correctamente")
      } else {
        // Crear nuevo usuario
        const usersRef = collection(db, "internalUsers")
        await addDoc(usersRef, {
          ...data,
          permissions: permissionsWithDefaults,
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
        })
        toast.success("Usuario creado correctamente")
      }
      onSuccess()
    } catch (error) {
      console.error("Error saving user:", error)
      toast.error("Error al guardar el usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para seleccionar/deseleccionar todos los permisos
  const toggleAllPermissions = (enable: boolean) => {
    const newPermissions = Object.keys(DEFAULT_PERMISSIONS).reduce((acc, key) => {
      acc[key as keyof UserPermissions] = enable
      return acc
    }, {} as UserPermissions)

    form.setValue("permissions", newPermissions)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Usuario" : "Nuevo Usuario"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Básica</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="nombre.usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditing ? "Nueva Contraseña (opcional)" : "Contraseña"}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={isEditing ? "Dejar en blanco para mantener la actual" : "Contraseña"}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {isEditing
                        ? "Deja este campo en blanco si no deseas cambiar la contraseña"
                        : "La contraseña debe tener al menos 6 caracteres"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                        <SelectItem value="gerente">Gerente</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Usuario Activo</FormLabel>
                      <FormDescription>Los usuarios inactivos no podrán acceder al sistema</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Permisos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Permisos de Acceso</h3>
                  <p className="text-sm text-muted-foreground">
                    Por defecto, todos los usuarios tienen acceso completo
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleAllPermissions(true)}>
                    Seleccionar Todo
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleAllPermissions(false)}>
                    Deseleccionar Todo
                  </Button>
                </div>
              </div>

              {permissionSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    {section.title}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.permissions.map((permission) => (
                      <FormField
                        key={permission.key}
                        control={form.control}
                        name={`permissions.${permission.key}`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">{permission.label}</FormLabel>
                              <FormDescription className="text-xs">{permission.description}</FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Usuario" : "Crear Usuario"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
