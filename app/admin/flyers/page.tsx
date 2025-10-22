"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"

type HeroSlide = {
  imageUrl: string
  width: number
  height: number
}

type PromoBanner = {
  imageUrl: string
  width: number
  height: number
  title: string
  description: string
  buttonText: string
  buttonLink: string
  termsText: string
  termsLink: string
  originalPrice: number
  discountedPrice: number
}

type CategoryImages = {
  [key: string]: string
}

type FlyersConfig = {
  heroSlides: HeroSlide[]
  promoBanner: PromoBanner
  categoryImages: CategoryImages
  updatedAt?: string | null
}

const HERO_REQUIRED = { width: 1600, height: 400 }
const PROMO_REQUIRED = { width: 1200, height: 400 }

export default function AdminFlyersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<FlyersConfig | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/flyers", { cache: "no-store" })
        if (!res.ok) throw new Error("No se pudo cargar la configuración")
        const data = (await res.json()) as FlyersConfig
        if (active) setConfig(data)
      } catch (e: any) {
        if (active) setError(e?.message || "Error al cargar")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const heroSlides = useMemo(() => config?.heroSlides ?? [], [config])
  const promoBanner = useMemo(() => config?.promoBanner, [config])
  const categoryImages = useMemo(() => config?.categoryImages ?? {}, [config])

  const handleUpload = async (file: File): Promise<string> => {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/upload-cloudinary", { method: "POST", body: form })
    if (!res.ok) throw new Error("Error subiendo imagen")
    const data = await res.json()
    return data.secure_url as string
  }

  const updateHeroImage = async (index: number, file: File) => {
    try {
      setSaving(true)
      const url = await handleUpload(file)
      setConfig((prev) => {
        if (!prev) return prev
        const nextSlides = [...prev.heroSlides]
        if (!nextSlides[index]) {
          nextSlides[index] = { imageUrl: url, width: HERO_REQUIRED.width, height: HERO_REQUIRED.height }
        } else {
          nextSlides[index] = { ...nextSlides[index], imageUrl: url }
        }
        return { ...prev, heroSlides: nextSlides }
      })
    } catch (e: any) {
      setError(e?.message || "Error actualizando slide")
    } finally {
      setSaving(false)
    }
  }

  const updatePromoImage = async (file: File) => {
    try {
      setSaving(true)
      const url = await handleUpload(file)
      setConfig((prev) => (prev ? { 
        ...prev, 
        promoBanner: { 
          ...prev.promoBanner, 
          imageUrl: url, 
          width: PROMO_REQUIRED.width, 
          height: PROMO_REQUIRED.height 
        } 
      } : prev))
    } catch (e: any) {
      setError(e?.message || "Error actualizando banner")
    } finally {
      setSaving(false)
    }
  }

  const updateCategoryImage = async (categoryKey: string, file: File) => {
    try {
      setSaving(true)
      const url = await handleUpload(file)
      setConfig((prev) => (prev ? { 
        ...prev, 
        categoryImages: { 
          ...prev.categoryImages, 
          [categoryKey]: url 
        } 
      } : prev))
    } catch (e: any) {
      setError(e?.message || "Error actualizando imagen de categoría")
    } finally {
      setSaving(false)
    }
  }

  const saveAll = async () => {
    if (!config) return
    try {
      setSaving(true)
      setError(null)
      const res = await fetch("/api/flyers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error("No se pudo guardar")
      router.refresh()
    } catch (e: any) {
      setError(e?.message || "Error guardando configuración")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <p>Cargando configuración...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-5xl p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Flyers y Banners</h1>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Carousel principal (Hero)</CardTitle>
          <CardDescription>
            Recomendado: {HERO_REQUIRED.width}x{HERO_REQUIRED.height} px. Se muestran 3 slides por defecto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">Slides: {heroSlides.length} (máx. 10)</div>
            <Button
              variant="outline"
              onClick={() => {
                setConfig((prev) => {
                  if (!prev) return prev
                  if (prev.heroSlides.length >= 10) return prev
                  return {
                    ...prev,
                    heroSlides: [
                      ...prev.heroSlides,
                      { imageUrl: "", width: HERO_REQUIRED.width, height: HERO_REQUIRED.height },
                    ],
                  }
                })
              }}
              disabled={(heroSlides?.length ?? 0) >= 10}
            >
              Agregar slide
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {heroSlides.map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[16/4] w-full overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroSlides[i]?.imageUrl || "/images/carousel/slide-0" + (i + 1) + ".jpg"}
                    alt={"Slide " + (i + 1)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`hero_${i}`}>Cambiar imagen (JPG/PNG)</Label>
                  <Input
                    id={`hero_${i}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void updateHeroImage(i, f)
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div>
                      <Label htmlFor={`w_${i}`}>Ancho (px)</Label>
                      <Input
                        id={`w_${i}`}
                        type="number"
                        value={heroSlides[i]?.width ?? HERO_REQUIRED.width}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          setConfig((prev) => {
                            if (!prev) return prev
                            const next = [...prev.heroSlides]
                            next[i] = { ...(next[i] || { imageUrl: "" }), width: value, height: next[i]?.height ?? HERO_REQUIRED.height }
                            return { ...prev, heroSlides: next }
                          })
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`h_${i}`}>Alto (px)</Label>
                      <Input
                        id={`h_${i}`}
                        type="number"
                        value={heroSlides[i]?.height ?? HERO_REQUIRED.height}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          setConfig((prev) => {
                            if (!prev) return prev
                            const next = [...prev.heroSlides]
                            next[i] = { ...(next[i] || { imageUrl: "" }), height: value, width: next[i]?.width ?? HERO_REQUIRED.width }
                            return { ...prev, heroSlides: next }
                          })
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setConfig((prev) => {
                        if (!prev) return prev
                        const next = prev.heroSlides.slice()
                        next.splice(i, 1)
                        return { ...prev, heroSlides: next }
                      })
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle>Banner promocional (CTA)</CardTitle>
          <CardDescription>
            Recomendado: {PROMO_REQUIRED.width}x{PROMO_REQUIRED.height} px.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vista previa */}
            <div className="space-y-4">
              <div className="aspect-[3/1] w-full overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={promoBanner?.imageUrl || "https://via.placeholder.com/1200x400?text=Promo+Banner"}
                  alt="Banner promocional"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo_upload">Cambiar imagen (JPG/PNG)</Label>
                <Input
                  id="promo_upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void updatePromoImage(f)
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="promo_w">Ancho (px)</Label>
                  <Input
                    id="promo_w"
                    type="number"
                    value={promoBanner?.width ?? PROMO_REQUIRED.width}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setConfig((prev) => (prev ? { ...prev, promoBanner: { ...(prev.promoBanner || { imageUrl: "" }), width: value, height: prev.promoBanner?.height ?? PROMO_REQUIRED.height } } : prev))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="promo_h">Alto (px)</Label>
                  <Input
                    id="promo_h"
                    type="number"
                    value={promoBanner?.height ?? PROMO_REQUIRED.height}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setConfig((prev) => (prev ? { ...prev, promoBanner: { ...(prev.promoBanner || { imageUrl: "" }), height: value, width: prev.promoBanner?.width ?? PROMO_REQUIRED.width } } : prev))
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Contenido editable */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promo_title">Título</Label>
                <Input
                  id="promo_title"
                  value={promoBanner?.title || ""}
                  onChange={(e) => {
                    setConfig((prev) => (prev ? { ...prev, promoBanner: { ...(prev.promoBanner || { imageUrl: "" }), title: e.target.value } } : prev))
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo_description">Descripción</Label>
                <textarea
                  id="promo_description"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  value={promoBanner?.description || ""}
                  onChange={(e) => {
                    setConfig((prev) => (prev ? { ...prev, promoBanner: { ...(prev.promoBanner || { imageUrl: "" }), description: e.target.value } } : prev))
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="promo_button_text">Texto del botón</Label>
                  <Input
                    id="promo_button_text"
                    value={promoBanner?.buttonText || ""}
                    onChange={(e) => {
                      setConfig((prev) => (prev ? { ...prev, promoBanner: { ...(prev.promoBanner || { imageUrl: "" }), buttonText: e.target.value } } : prev))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="promo_button_link">Link del botón</Label>
                  <Input
                    id="promo_button_link"
                    value={promoBanner?.buttonLink || ""}
                    onChange={(e) => {
                      setConfig((prev) => (prev ? { ...prev, promoBanner: { ...(prev.promoBanner || { imageUrl: "" }), buttonLink: e.target.value } } : prev))
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="promo_original_price">Precio original (USD)</Label>
                  <Input
                    id="promo_original_price"
                    type="number"
                    value={promoBanner?.originalPrice || 0}
                    onChange={(e) => {
                      setConfig((prev) => (prev ? { ...prev, promoBanner: { ...(prev.promoBanner || { imageUrl: "" }), originalPrice: Number(e.target.value) } } : prev))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="promo_discounted_price">Precio con descuento (USD)</Label>
                  <Input
                    id="promo_discounted_price"
                    type="number"
                    value={promoBanner?.discountedPrice || 0}
                    onChange={(e) => {
                      setConfig((prev) => (prev ? { ...prev, promoBanner: { ...(prev.promoBanner || { imageUrl: "" }), discountedPrice: Number(e.target.value) } } : prev))
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="promo_terms_text">Texto de términos</Label>
                  <Input
                    id="promo_terms_text"
                    value={promoBanner?.termsText || ""}
                    onChange={(e) => {
                      setConfig((prev) => (prev ? { ...prev, promoBanner: { ...(prev.promoBanner || { imageUrl: "" }), termsText: e.target.value } } : prev))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="promo_terms_link">Link de términos</Label>
                  <Input
                    id="promo_terms_link"
                    value={promoBanner?.termsLink || ""}
                    onChange={(e) => {
                      setConfig((prev) => (prev ? { ...prev, promoBanner: { ...(prev.promoBanner || { imageUrl: "" }), termsLink: e.target.value } } : prev))
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle>Imágenes de categorías</CardTitle>
          <CardDescription>
            Cambiá las imágenes que se muestran en la sección "Explorá nuestras categorías". 
            Total: {Object.keys(categoryImages).length} categorías disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(categoryImages).map(([categoryKey, imageUrl]) => (
              <div key={categoryKey} className="space-y-3">
                <div className="aspect-square w-full overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt={categoryKey}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`category_${categoryKey}`} className="capitalize text-sm">
                    {categoryKey.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Input
                    id={`category_${categoryKey}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void updateCategoryImage(categoryKey, f)
                    }}
                    className="text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


