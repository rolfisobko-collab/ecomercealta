"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { doc, updateDoc, Timestamp } from "firebase/firestore"
import { Loader2 } from "lucide-react"

interface ProfileInfoProps {
  user: any // Replace 'any' with the actual type of your user object
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  const [name, setName] = useState(user.displayName || "")
  const [email, setEmail] = useState(user.email || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setName(user.displayName || "")
    setEmail(user.email || "")
  }, [user])

  const handleUpdateProfile = async () => {
    setIsUpdating(true)
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        name: name,
        updatedAt: Timestamp.fromDate(new Date()),
      })

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
      setIsUpdating(false)
    }
  }

  return (
    <Card className="border-0 shadow-none ring-0 outline-none">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Tu email" value={email} readOnly />
        </div>
      </CardContent>
      <Button onClick={handleUpdateProfile} disabled={isUpdating} className="bg-red-600 hover:bg-red-700">
        {isUpdating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Actualizando...
          </>
        ) : (
          "Guardar Cambios"
        )}
      </Button>
    </Card>
  )
}
