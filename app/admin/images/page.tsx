"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UploadProductImages from "@/components/admin/UploadProductImages"
import FirebaseImagesContent from "@/components/images/FirebaseImagesContent"

export default function AdminImagesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Gestión de imágenes</h1>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="upload">Subir imágenes</TabsTrigger>
          <TabsTrigger value="browse">Explorar imágenes</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-0">
          <UploadProductImages />
        </TabsContent>

        <TabsContent value="browse" className="mt-0">
          <FirebaseImagesContent />
        </TabsContent>
      </Tabs>
    </div>
  )
}
