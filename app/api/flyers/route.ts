import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import { getRedis } from "@/lib/redis"

export const dynamic = 'force-dynamic'
export const revalidate = 0

const DEFAULT_CONFIG = {
  heroSlides: [
    { imageUrl: "/images/carousel/slide-01.jpg", width: 1600, height: 400 },
    { imageUrl: "/images/carousel/slide-02.jpg", width: 1600, height: 400 },
    { imageUrl: "/images/carousel/slide-03.png", width: 1600, height: 400 },
  ],
  promoBanner: {
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/iPhone-16-Pro-Max-lanzamiento.jpg-Y9YfExqsvxwFlU4fYjjPvWK9K2aUpH.jpeg",
    width: 1200,
    height: 400,
    title: "Nuevo iPhone 16 Pro Max",
    description: "Descubrí el poder del nuevo chip A18 Pro y la cámara más avanzada en un iPhone. Disponible ahora con entrega inmediata.",
    buttonText: "Ver detalles",
    buttonLink: "/products/iphone-16-pro-max",
    termsText: "Ver bases y condiciones",
    termsLink: "/terminos",
    originalPrice: 1499,
    discountedPrice: 1250,
  },
  categoryImages: {
    camaras: "/category-images/phone-cameras.png",
    fpc: "/placeholder.svg",
    upcycledparts: "/placeholder.svg",
    homeboton: "/category-images/home-buttons.png",
    flashflex: "/placeholder.svg",
    celulares: "/category-images/modern-smartphones.png",
    tablet: "/category-images/tablets.png",
    tapticengine: "/placeholder.svg",
    powerflex: "/placeholder.svg",
    glass: "/cracked-phone-close-up.png",
    flexdesensor: "/placeholder.svg",
    accesorios: "/colorful-phone-accessories.png",
    parlante: "/placeholder.svg",
    flexantena: "/placeholder.svg",
    bateras: "/portable-power-essentials.png",
    herramientaseinsumos: "/phone-repair-tools.png",
    tv: "/placeholder.svg",
    marco: "/placeholder.svg",
    tagon: "/placeholder.svg",
    speaker: "/placeholder.svg",
    antenas: "/placeholder.svg",
    placadecarga: "/placeholder.svg",
    socalodesim: "/placeholder.svg",
    combos: "/placeholder.svg",
    icdecarga: "/placeholder.svg",
    tapas: "/modern-smartwatch-display.png",
    placas: "/placeholder.svg",
    visordecamara: "/placeholder.svg",
    blindajes: "/placeholder.svg",
    flexwifi: "/placeholder.svg",
    volumenflex: "/placeholder.svg",
    pegatinas: "/placeholder.svg",
    pinesdecarga: "/placeholder.svg",
    sensorhuella: "/placeholder.svg",
    tornillos: "/placeholder.svg",
    botones: "/placeholder.svg",
    modulos: "/high-end-asus-motherboard.png",
    flexdecarga: "/placeholder.svg",
    sensores: "/placeholder.svg",
    buzzer: "/placeholder.svg",
    mainflex: "/placeholder.svg",
    tactil: "/placeholder.svg",
    chasis: "/placeholder.svg",
    flexhome: "/placeholder.svg",
    portasim: "/placeholder.svg",
  },
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0"
const MONGODB_DB = process.env.MONGODB_DB || "test"

async function getDb() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(MONGODB_DB)
  return { client, db }
}

export async function GET() {
  let client: MongoClient | null = null
  try {
    // Try Redis fast path
    const redis = getRedis()
    let version = '1'
    if (redis) {
      const v = await redis.get<string>('flyers:ver')
      version = v ? String(v) : '1'
      const cacheKey = `flyers:cfg:v${version}`
      const hit = await redis.get<string>(cacheKey)
      if (hit) {
        return new NextResponse(hit, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 's-maxage=60, stale-while-revalidate=600',
            'ETag': `W/"flyers-${version}"`,
          },
        })
      }
    }

    // Miss: read from Mongo and backfill Redis
    const conn = await getDb()
    client = conn.client
    const { db } = conn
    const collection = db.collection("settings")

    const doc = await collection.findOne({ key: "flyersConfig" })
    const stored = (doc || {}) as any
    const updatedAt = stored?.updatedAt || null

    const heroSlides = Array.isArray(stored.heroSlides) && stored.heroSlides.length
      ? stored.heroSlides.map((s: any, i: number) => ({
          imageUrl: String(s?.imageUrl || DEFAULT_CONFIG.heroSlides[i]?.imageUrl || ""),
          width: Number(s?.width || DEFAULT_CONFIG.heroSlides[i]?.width || 1600),
          height: Number(s?.height || DEFAULT_CONFIG.heroSlides[i]?.height || 400),
        }))
      : DEFAULT_CONFIG.heroSlides

    const promoBanner = {
      ...DEFAULT_CONFIG.promoBanner,
      ...(stored.promoBanner || {}),
    }

    const categoryImages = { ...DEFAULT_CONFIG.categoryImages, ...(stored.categoryImages || {}) }

    const responseObj = {
      heroSlides,
      promoBanner,
      categoryImages,
      updatedAt,
    }
    const json = JSON.stringify(responseObj)

    if (redis) {
      const cacheKey = `flyers:cfg:v${version}`
      await redis.set(cacheKey, json)
    }

    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=600',
        'ETag': `W/"flyers-${version}"`,
      },
    })
  } catch (error) {
    console.error("/api/flyers GET error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}

export async function PUT(request: Request) {
  let client: MongoClient | null = null
  try {
    const body = await request.json()

    // Validación mínima
    const heroSlides = Array.isArray(body.heroSlides) ? body.heroSlides.slice(0, 10) : DEFAULT_CONFIG.heroSlides
    const promoBanner = body.promoBanner && body.promoBanner.imageUrl ? body.promoBanner : DEFAULT_CONFIG.promoBanner
    const categoryImages = body.categoryImages || DEFAULT_CONFIG.categoryImages

    const payload = {
      key: "flyersConfig",
      heroSlides: heroSlides.map((s: any) => ({
        imageUrl: String(s.imageUrl || ""),
        width: Number(s.width || 1600),
        height: Number(s.height || 400),
      })),
      promoBanner: {
        imageUrl: String(promoBanner.imageUrl || ""),
        width: Number(promoBanner.width || 1200),
        height: Number(promoBanner.height || 400),
        title: String(promoBanner.title || DEFAULT_CONFIG.promoBanner.title),
        description: String(promoBanner.description || DEFAULT_CONFIG.promoBanner.description),
        buttonText: String(promoBanner.buttonText || DEFAULT_CONFIG.promoBanner.buttonText),
        buttonLink: String(promoBanner.buttonLink || DEFAULT_CONFIG.promoBanner.buttonLink),
        termsText: String(promoBanner.termsText || DEFAULT_CONFIG.promoBanner.termsText),
        termsLink: String(promoBanner.termsLink || DEFAULT_CONFIG.promoBanner.termsLink),
        originalPrice: Number(promoBanner.originalPrice || DEFAULT_CONFIG.promoBanner.originalPrice),
        discountedPrice: Number(promoBanner.discountedPrice || DEFAULT_CONFIG.promoBanner.discountedPrice),
      },
      categoryImages: categoryImages,
      updatedAt: new Date().toISOString(),
    }

    const conn = await getDb()
    client = conn.client
    const { db } = conn
    const collection = db.collection("settings")

    await collection.updateOne({ key: "flyersConfig" }, { $set: payload }, { upsert: true })

    try {
      const redis = getRedis()
      if (redis) {
        const newVer = String((Number((await redis.get('flyers:ver')) || '0')) + 1)
        await redis.set('flyers:ver', newVer)
        await redis.set('flyers:updatedAt', String(Date.now()))
        const cacheKey = `flyers:cfg:v${newVer}`
        await redis.set(cacheKey, JSON.stringify({
          heroSlides: payload.heroSlides,
          promoBanner: payload.promoBanner,
          categoryImages: payload.categoryImages,
          updatedAt: payload.updatedAt,
        }))
      }
    } catch {}

    return NextResponse.json({ ok: true, updatedAt: payload.updatedAt }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error("/api/flyers PUT error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  } finally {
    if (client) await client.close()
  }
}


