"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Shield, ShieldCheck, Eye } from "lucide-react"
import { toast } from "sonner"
import { UserForm } from "./UserForm"

// Definir la interfaz User con permisos
interface UserInterface {
  id: string
  name: string
  username: string
  password: string
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

// Permisos por defecto
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

export function UserList() {
  const [users, setUsers] = useState<UserInterface[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserInterface | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersRef = collection(db, "internalUsers")
      const q = query(usersRef, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const loadedUsers = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || "",
          username: data.username || "",
          password: data.password || "",
          role: data.role || "tecnico",
          active: data.active !== undefined ? data.active : true,
          permissions: data.permissions || DEFAULT_PERMISSIONS,
          createdAt: data.createdAt?.toDate() || new Date(),
        }
      })

      setUsers(loadedUsers)
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Error al cargar los usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "internalUsers", userId))
      toast.success("Usuario eliminado correctamente")
      loadUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Error al eliminar el usuario")
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setSelectedUser(null)
    loadUsers()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "gerente":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "marketing":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="h-4 w-4" />
      case "gerente":
        return <Shield className="h-4 w-4" />
      default:
        return (
          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
            U
          </div>
        )
    }
  }

  const countEnabledPermissions = (permissions: UserPermissions) => {
    return Object.values(permissions).filter(Boolean).length
  }

  const totalPermissions = 14 // Total de permisos disponibles

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra los usuarios del sistema y sus permisos de acceso
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedUser(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
            </DialogHeader>
            <UserForm user={selectedUser || undefined} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role === "admin"
                          ? "Administrador"
                          : user.role === "gerente"
                            ? "Gerente"
                            : user.role === "marketing"
                              ? "Marketing"
                              : "Técnico"}
                      </Badge>
                      <Badge variant={user.active ? "default" : "secondary"}>
                        {user.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right mr-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Permisos:</span>{" "}
                      <span className="text-green-600 dark:text-green-400">
                        {countEnabledPermissions(user.permissions)}/{totalPermissions}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Creado: {user.createdAt.toLocaleDateString()}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user)
                      setIsPermissionsOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Permisos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user)
                      setIsFormOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
                          <strong>{user.name}</strong> del sistema.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para ver permisos */}
      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Permisos de {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {[
                {
                  title: "Principal",
                  permissions: [
                    { key: "dashboard", label: "Dashboard" },
                    { key: "ventas", label: "Ventas" },
                    { key: "caja", label: "Caja" },
                    { key: "deposito", label: "Depósito" },
                    { key: "balances", label: "Balances" },
                    { key: "serviciotec", label: "Servicio Técnico" },
                  ],
                },
                {
                  title: "Transacciones",
                  permissions: [
                    { key: "registros", label: "Registros" },
                    { key: "deudas", label: "Deudas" },
                  ],
                },
                {
                  title: "Inventario",
                  permissions: [
                    { key: "products", label: "Productos" },
                    { key: "categories", label: "Categorías" },
                    { key: "suppliers", label: "Proveedores" },
                    { key: "purchases", label: "Movimientos" },
                  ],
                },
                {
                  title: "Administración",
                  permissions: [
                    { key: "orders", label: "Pedidos" },
                    { key: "users", label: "Usuarios" },
                  ],
                },
              ].map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{section.title}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {section.permissions.map((permission) => (
                      <div key={permission.key} className="flex items-center space-x-2">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            selectedUser.permissions[permission.key as keyof UserPermissions]
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <span className="text-sm">{permission.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
