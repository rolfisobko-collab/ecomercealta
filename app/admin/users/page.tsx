"use client"

import { UserList } from "@/components/users/UserList"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function UsersPage() {
  const router = useRouter()

  // Verificar autenticación en el cliente
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin") === "true"
    if (!isAdmin) {
      router.push("/auth/admin-login")
    }
  }, [router])

  return (
    <div className="container mx-auto py-10 px-6 md:px-10">
      {/* 
        Este componente obtiene los datos directamente de la colección "users" en Firestore,
        no utiliza Firebase Auth en absoluto. Es un CRUD simple que almacena y gestiona
        usuarios en Firestore como cualquier otra colección.
      */}
      <UserList />
    </div>
  )
}
