"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Category } from "@/models/Category"
import { categoryService } from "@/services/hybrid/categoryService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload, ImageIcon, LinkIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ICON_CATALOG, getIconByKey, type IconKey } from "@/utils/categoryIcons"
import { uploadToCloudinary } from "@/lib/cloudinary"

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = React.use(params)
  const [category, setCategory] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [iconKey, setIconKey] = useState<IconKey | "">("")
  const [iconMode, setIconMode] = useState<'catalog' | 'image'>("catalog")
  const [iconImageFile, setIconImageFile] = useState<File | null>(null)
  const [iconImagePreview, setIconImagePreview] = useState<string | null>(null)
  const [iconCropping, setIconCropping] = useState(false)
  const [applyCooldown, setApplyCooldown] = useState(0)
  // Cropper state
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null)
  const [crop, setCrop] = useState<{ x: number; y: number; size: number } | null>(null) // in container px
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState<null | 'nw' | 'ne' | 'sw' | 'se'>(null)
  const cropperRef = React.useRef<HTMLDivElement | null>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const previewCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
  // no external cropper

  // Cargar la categoría existente
  useEffect(() => {
    const fetchCategory = async () => {
      setIsLoading(true)
      try {
        const fetchedCategory = await categoryService.getById(id)
        if (fetchedCategory) {
          setCategory(fetchedCategory)
          setName(fetchedCategory.name)
          setDescription(fetchedCategory.description || "")
          setImageUrl(fetchedCategory.imageUrl || "")
          const iconVal = String((fetchedCategory as any).icon || "")
          // Si el icono es una URL, usar modo imagen
          if (iconVal.startsWith('http') || iconVal.startsWith('data:')) {
            setIconMode('image')
            setIconImagePreview(iconVal)
            setIconKey("")
          } else {
            setIconKey(iconVal as IconKey)
            setIconMode('catalog')
          }
          if (fetchedCategory.imageUrl) {
            setImagePreview(fetchedCategory.imageUrl)
          }
        } else {
          toast({
            title: "Error",
            description: "No se encontró la categoría",
            variant: "destructive",
          })
          router.push("/admin/categories")
        }
      } catch (error) {
        console.error("Error al cargar la categoría:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la categoría",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchCategory()
    }
  }, [id, router])

  // Cooldown countdown
  useEffect(() => {
    if (applyCooldown <= 0) return
    const t = setInterval(() => setApplyCooldown((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [applyCooldown])

  // Helper: rendered image box inside container for object-contain
  const getRenderBox = () => {
    if (!imgRef.current || !cropperRef.current) return null
    const img = imgRef.current
    const rect = cropperRef.current.getBoundingClientRect()
    const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight)
    const renderW = img.naturalWidth * scale
    const renderH = img.naturalHeight * scale
    const offX = (rect.width - renderW) / 2
    const offY = (rect.height - renderH) / 2
    return { rect, renderW, renderH, offX, offY, scale }
  }

  // Sync live preview canvas when crop changes (top-level hook)
  useEffect(() => {
    if (!iconImagePreview || !crop || !imgRef.current || !previewCanvasRef.current || !cropperRef.current) return
    const img = imgRef.current
    const canvas = previewCanvasRef.current
    const box = getRenderBox()
    if (!box) return
    const scaleX = img.naturalWidth / box.renderW
    const scaleY = img.naturalHeight / box.renderH
    const sx = Math.round((crop.x - box.offX) * scaleX)
    const sy = Math.round((crop.y - box.offY) * scaleY)
    const sSize = Math.round(crop.size * Math.min(scaleX, scaleY))
    const ctx = canvas.getContext('2d')!
    const out = 512
    canvas.width = out
    canvas.height = out
    ctx.clearRect(0,0,out,out)
    try { ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, out, out) } catch {}
  }, [iconImagePreview, crop])

  // Initialize crop when image loads
  const onIconImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
    const box = getRenderBox()
    if (!box) return
    const size = Math.min(box.renderW, box.renderH) * 0.7
    setCrop({ x: box.offX + (box.renderW - size)/2, y: box.offY + (box.renderH - size)/2, size })
  }

  // Mouse interactions (top-level hooks)
  const toLocal = (clientX: number, clientY: number) => {
    const r = cropperRef.current!.getBoundingClientRect()
    return { x: clientX - r.left, y: clientY - r.top, w: r.width, h: r.height }
  }
  const clampCrop = (c: { x: number; y: number; size: number }) => {
    const box = getRenderBox()!
    const minSize = 24
    const maxSize = Math.min(box.renderW, box.renderH)
    const size = Math.min(Math.max(minSize, c.size), maxSize)
    const minX = box.offX
    const minY = box.offY
    const maxX = box.offX + box.renderW - size
    const maxY = box.offY + box.renderH - size
    return {
      x: Math.min(Math.max(minX, c.x), maxX),
      y: Math.min(Math.max(minY, c.y), maxY),
      size,
    }
  }
  const onMouseDownSel = (e: React.MouseEvent) => { e.preventDefault(); setDragging(true) }
  const onMouseDownHandle = (dir: 'nw'|'ne'|'sw'|'se') => (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setResizing(dir) }
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!cropperRef.current || !crop) return
      const loc = toLocal(e.clientX, e.clientY)
      if (dragging) {
        const centerOffset = crop.size / 2
        setCrop(clampCrop({ x: loc.x - centerOffset, y: loc.y - centerOffset, size: crop.size }))
      } else if (resizing) {
        const cx = crop.x + crop.size / 2
        const cy = crop.y + crop.size / 2
        const dx = Math.abs(loc.x - cx)
        const dy = Math.abs(loc.y - cy)
        const newSize = Math.max(24, Math.max(dx, dy) * 2)
        setCrop(clampCrop({ x: cx - newSize/2, y: cy - newSize/2, size: newSize }))
      }
    }
    const onUp = () => { setDragging(false); setResizing(null) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, resizing, crop])

  // Manejar cambio de archivo de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. El tamaño máximo permitido es 5MB.",
          variant: "destructive",
        })
        return
      }

      // Validar tipo de archivo
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG, WEBP y GIF.",
          variant: "destructive",
        })
        return
      }

      setImageFile(file)
      setUploadError(null)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Manejar cambio de URL de imagen
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    if (url) {
      setImagePreview(url)
    } else {
      setImagePreview(null)
    }
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setUploadError(null)

    try {
      // Validar formulario
      if (!name.trim()) {
        toast({
          title: "Error",
          description: "El nombre de la categoría es obligatorio",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      let finalImageUrl = imageUrl

      // Si hay un archivo de imagen nuevo, subirlo a Cloudinary
      if (imageFile) {
        try {
          setUploadProgress(10)

          // Usar la función de Cloudinary para subir la imagen
          const result = await uploadToCloudinary(imageFile)

          setUploadProgress(100)

          if (result && result.secure_url) {
            finalImageUrl = result.secure_url
          } else {
            throw new Error("No se pudo obtener la URL de la imagen subida")
          }
        } catch (error: any) {
          console.error("Error al subir la imagen:", error)
          setUploadError(error.message || "Error al subir la imagen")
          toast({
            title: "Error",
            description: error.message || "No se pudo subir la imagen",
            variant: "destructive",
          })
          setIsSaving(false)
          return
        }
      }

      // Actualizar la categoría
      if (category) {
        // Resolver icon final: si hay imagen subida, usar esa URL; si no, usar iconKey
        let finalIcon = iconKey || ""
        if (iconImageFile) {
          try {
            const result = await uploadToCloudinary(iconImageFile)
            if (result && result.secure_url) {
              finalIcon = result.secure_url
            }
          } catch (err) {
            console.error('Error subiendo icono PNG:', err)
          }
        } else if (iconMode === 'image' && iconImagePreview) {
          finalIcon = iconImagePreview
        }
        await categoryService.update(id, {
          name,
          description,
          imageUrl: finalImageUrl,
          icon: finalIcon,
          updatedAt: new Date().toISOString(),
        })

        toast({
          title: "Éxito",
          description: "Categoría actualizada correctamente",
        })
        router.push("/admin/categories")
      }
    } catch (error: any) {
      console.error("Error al actualizar la categoría:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la categoría",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Utilidad: recorte cuadrado centrado para ícono PNG (sin libs externas)
  const cropCenterSquare = async (srcDataUrl: string, mime = 'image/png'): Promise<{ dataUrl: string; file: File }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      // Si es data URL no habrá CORS; si es externa podría fallar
      if (!srcDataUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous'
      }
      img.onload = () => {
        try {
          const size = Math.min(img.width, img.height)
          const sx = Math.floor((img.width - size) / 2)
          const sy = Math.floor((img.height - size) / 2)
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')!
          ctx.imageSmoothingEnabled = true
          ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('No se pudo generar el recorte'))
            const file = new File([blob], 'icon-cropped.png', { type: mime })
            const fr = new FileReader()
            fr.onloadend = () => resolve({ dataUrl: fr.result as string, file })
            fr.onerror = reject
            fr.readAsDataURL(file)
          }, mime)
        } catch (e) {
          reject(e)
        }
      }
      img.onerror = reject
      img.src = srcDataUrl
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando categoría...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Editar Categoría</h1>
        <Button variant="outline" onClick={() => router.push("/admin/categories")}>
          Volver a Categorías
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Categoría</CardTitle>
          <CardDescription>Actualiza los detalles de la categoría y su imagen asociada.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la categoría"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la categoría"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Ícono (se verá en /gremio)</Label>
              <Tabs value={iconMode} onValueChange={(v) => setIconMode(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="catalog">Catálogo</TabsTrigger>
                  <TabsTrigger value="image">Imagen PNG</TabsTrigger>
                </TabsList>
                <TabsContent value="catalog" className="space-y-2">
                  <div className="flex items-center gap-3">
                    <select
                      id="icon"
                      className="flex-1 border rounded-md px-3 py-2 bg-white/50 dark:bg-gray-800/50"
                      value={iconKey}
                      onChange={(e) => setIconKey(e.target.value as IconKey)}
                    >
                      <option value="">Sin ícono</option>
                      {Object.keys(ICON_CATALOG).map((key) => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                    <div className="w-10 h-10 flex items-center justify-center rounded-md bg-red-50 dark:bg-red-900/20">
                      {(() => { const Icon = getIconByKey(iconKey); return <Icon className="h-5 w-5 text-red-600 dark:text-red-400"/> })()}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Elegí un ícono del catálogo para /gremio</p>
                </TabsContent>
                <TabsContent value="image" className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 cursor-pointer">
                      <span className="text-sm text-gray-600">Subir PNG para ícono</span>
                      <input
                        type="file"
                        accept="image/png"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) {
                            if (f.size > 1024 * 1024) { // 1MB
                              toast({ title: 'PNG demasiado grande', description: 'Máximo 1MB', variant: 'destructive' })
                              return
                            }
                            setIconImageFile(f)
                            const reader = new FileReader()
                            reader.onloadend = () => setIconImagePreview(reader.result as string)
                            reader.readAsDataURL(f)
                            setIconKey("")
                          }
                        }}
                      />
                    </label>
                    {iconImagePreview && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div ref={cropperRef} className="relative h-64 md:h-80 w-full rounded-md overflow-hidden bg-gray-50">
                          <img ref={imgRef} src={iconImagePreview} onLoad={onIconImageLoad} alt="Icono" className="absolute inset-0 w-full h-full object-contain" />
                          {crop && (
                            <div
                              className="absolute bg-black/10 border-2 border-red-500"
                              style={{ left: crop.x, top: crop.y, width: crop.size, height: crop.size }}
                              onMouseDown={onMouseDownSel}
                            >
                              <div className="absolute w-3 h-3 bg-red-500 -top-1.5 -left-1.5" style={{ cursor: 'nwse-resize' }} onMouseDown={onMouseDownHandle('nw')}></div>
                              <div className="absolute w-3 h-3 bg-red-500 -top-1.5 -right-1.5" style={{ cursor: 'nesw-resize' }} onMouseDown={onMouseDownHandle('ne')}></div>
                              <div className="absolute w-3 h-3 bg-red-500 -bottom-1.5 -left-1.5" style={{ cursor: 'nesw-resize' }} onMouseDown={onMouseDownHandle('sw')}></div>
                              <div className="absolute w-3 h-3 bg-red-500 -bottom-1.5 -right-1.5" style={{ cursor: 'nwse-resize' }} onMouseDown={onMouseDownHandle('se')}></div>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="mt-1">
                            <p className="text-xs text-gray-600 mb-1">Vista previa</p>
                            <canvas ref={previewCanvasRef} className="w-40 h-40 border rounded bg-white" />
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={iconCropping || !crop || applyCooldown > 0}
                              onClick={async () => {
                                if (!iconImagePreview || !crop || !imgRef.current || !cropperRef.current) return
                                try {
                                  setIconCropping(true)
                                  const rect = cropperRef.current.getBoundingClientRect()
                                  const box = getRenderBox()
                                  if (!box) return
                                  const scaleX = imgRef.current.naturalWidth / box.renderW
                                  const scaleY = imgRef.current.naturalHeight / box.renderH
                                  const sx = Math.round((crop.x - box.offX) * scaleX)
                                  const sy = Math.round((crop.y - box.offY) * scaleY)
                                  const sSize = Math.round(crop.size * Math.min(scaleX, scaleY))

                                  const srcForExport = async (): Promise<HTMLImageElement | null> => {
                                    return new Promise(async (resolve) => {
                                      const tmp = new Image()
                                      if (!iconImagePreview.startsWith('data:')) {
                                        tmp.crossOrigin = 'anonymous'
                                      }
                                      tmp.onload = () => resolve(tmp)
                                      tmp.onerror = async () => {
                                        try {
                                          // Fallback: fetch as blob (may still require CORS)
                                          const res = await fetch(iconImagePreview, { mode: 'cors' })
                                          const blob = await res.blob()
                                          const url = URL.createObjectURL(blob)
                                          const tmp2 = new Image()
                                          tmp2.onload = () => { URL.revokeObjectURL(url); resolve(tmp2) }
                                          tmp2.onerror = () => resolve(null)
                                          tmp2.src = url
                                        } catch { resolve(null) }
                                      }
                                      tmp.src = iconImagePreview
                                    })
                                  }

                                  const source = await srcForExport()
                                  if (!source) {
                                    toast({ title: 'No se puede recortar esta imagen', description: 'Subí un PNG desde tu dispositivo para recortar.', variant: 'destructive' })
                                    return
                                  }

                                  const canvas = document.createElement('canvas')
                                  canvas.width = sSize
                                  canvas.height = sSize
                                  const ctx = canvas.getContext('2d')!
                                  ctx.drawImage(source, sx, sy, sSize, sSize, 0, 0, sSize, sSize)
                                  canvas.toBlob((blob) => {
                                    if (!blob) return
                                    const file = new File([blob], 'icon-cropped.png', { type: 'image/png' })
                                    const fr = new FileReader()
                                    fr.onloadend = () => {
                                      setIconImagePreview(fr.result as string)
                                      setIconImageFile(file)
                                      toast({ title: 'Ícono recortado', description: 'Botón bloqueado 10s para evitar recortes accidentales.' })
                                      setApplyCooldown(10)
                                    }
                                    fr.readAsDataURL(file)
                                  }, 'image/png')
                                } finally {
                                  setIconCropping(false)
                                }
                              }}
                            >
                              {applyCooldown > 0 ? `Aplicar recorte (${applyCooldown}s)` : (iconCropping ? 'Aplicando…' : 'Aplicar recorte')}
                            </Button>
                            <Button variant="ghost" size="sm" type="button" onClick={() => { setIconImageFile(null); setIconImagePreview(null) }}>Quitar</Button>
                            {applyCooldown > 0 && (
                              <div className="text-[11px] text-gray-500 mt-1">Esperá {applyCooldown}s para volver a recortar.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Formato recomendado: PNG cuadrado. Podés mover y hacer zoom para ajustar.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-4">
              <Label>Imagen de la categoría</Label>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir imagen
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    URL de imagen
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4">
                  <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-500 mb-2" />
                        <span className="text-sm text-gray-500">Haz clic para seleccionar una imagen</span>
                        <span className="text-xs text-gray-400 mt-1">Máximo 5MB - Formatos: JPG, PNG, WEBP, GIF</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>

                  {uploadError && <div className="text-sm text-red-500 mt-2">Error: {uploadError}</div>}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">URL de la imagen</Label>
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Vista previa:</p>
                  <div className="relative h-48 w-full overflow-hidden rounded-md border">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Vista previa"
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/categories")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
