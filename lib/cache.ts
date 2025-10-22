// Sistema de caché simplificado - solo para casos específicos donde no se necesita tiempo real

interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

// Caché en memoria - solo para datos que no necesitan actualizaciones en tiempo real
const memoryCache: Record<string, CacheItem<any>> = {}

// Duración muy corta por defecto: 30 segundos (para evitar conflictos con tiempo real)
const DEFAULT_CACHE_DURATION = 30 * 1000

// Función para guardar datos en la caché (solo usar para datos estáticos)
export function setCache<T>(key: string, data: T, duration: number = DEFAULT_CACHE_DURATION): void {
  const timestamp = Date.now()
  const expiry = timestamp + duration

  // Solo guardar en memoria para evitar conflictos con localStorage
  memoryCache[key] = { data, timestamp, expiry }

  console.log(`💾 Cache set for key: ${key} (expires in ${duration}ms)`)
}

// Función para obtener datos de la caché
export function getCache<T>(key: string): T | null {
  const now = Date.now()

  // Solo verificar caché en memoria
  const memoryItem = memoryCache[key]
  if (memoryItem && memoryItem.expiry > now) {
    console.log(`⚡ Cache hit for key: ${key}`)
    return memoryItem.data as T
  }

  if (memoryItem && memoryItem.expiry <= now) {
    console.log(`⏰ Cache expired for key: ${key}`)
    delete memoryCache[key]
  }

  return null
}

// Función para invalidar la caché
export function invalidateCache(key: string): void {
  delete memoryCache[key]
  console.log(`🗑️ Cache invalidated for key: ${key}`)
}

// Función para invalidar toda la caché
export function clearCache(): void {
  Object.keys(memoryCache).forEach((key) => {
    delete memoryCache[key]
  })
  console.log("🧹 All cache cleared")
}

// Función para verificar si una clave está en caché
export function isCached(key: string): boolean {
  const now = Date.now()
  const memoryItem = memoryCache[key]
  return memoryItem && memoryItem.expiry > now
}
