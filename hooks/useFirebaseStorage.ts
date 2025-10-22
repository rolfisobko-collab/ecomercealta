"use client"

import { useState, useEffect, useCallback } from "react"
import { storage } from "@/lib/firebase"
import { ref, getDownloadURL, list, uploadBytesResumable } from "firebase/storage"

interface ImageItem {
  name: string
  url: string
  path: string
  folder: string
}

export function useFirebaseStorage(path = "") {
  const [images, setImages] = useState<ImageItem[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [loadedAll, setLoadedAll] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [url, setUrl] = useState<string | null>(null)

  // Función para cargar imágenes con paginación
  const loadImages = useCallback(
    async (reset = true) => {
      try {
        if (reset) {
          setLoading(true)
          setError(null)
          setImages([])
          setFolders([])
          setLoadedAll(false)
        }

        // Referencia al bucket de storage
        const storageRef = ref(storage, path)

        // Usar list en lugar de listAll para implementar paginación
        // Limitamos a 20 items por página para reducir la carga
        const result = await list(storageRef, { maxResults: 20 })

        // Extraer carpetas
        const folderSet = new Set<string>()

        // Procesar los prefijos (carpetas)
        result.prefixes.forEach((folderRef) => {
          folderSet.add(folderRef.name)
        })

        setFolders((prev) => [...prev, ...Array.from(folderSet)])

        // Procesar los items (archivos) con un límite de operaciones concurrentes
        const processItems = async (items: any[]) => {
          const results = []
          // Reducir a lotes de 2 para evitar demasiadas operaciones concurrentes
          for (let i = 0; i < items.length; i += 2) {
            const batch = items.slice(i, i + 2)

            // Procesar cada lote secuencialmente
            for (const itemRef of batch) {
              try {
                // Implementar reintento con backoff exponencial y tiempos más largos
                const getUrlWithRetry = async (retries = 5, initialDelay = 2000) => {
                  try {
                    return await getDownloadURL(itemRef)
                  } catch (err: any) {
                    console.log(`Reintento ${6 - retries} para ${itemRef.name}`)

                    // Si es un error de límite de reintentos, esperar más tiempo
                    if (err.code === "storage/retry-limit-exceeded" && retries <= 0) {
                      throw new Error(`Límite de reintentos excedido para ${itemRef.name}`)
                    }

                    if (retries <= 0) throw err

                    // Esperar más tiempo entre reintentos
                    const delay = initialDelay * Math.pow(1.5, 5 - retries) + Math.random() * 1000
                    console.log(`Esperando ${delay}ms antes del siguiente reintento`)
                    await new Promise((resolve) => setTimeout(resolve, delay))
                    return getUrlWithRetry(retries - 1, initialDelay)
                  }
                }

                const url = await getUrlWithRetry()
                const pathParts = itemRef.fullPath.split("/")
                const folder = pathParts.length > 1 ? pathParts[0] : "root"

                results.push({
                  name: itemRef.name,
                  url,
                  path: itemRef.fullPath,
                  folder,
                })
              } catch (err) {
                console.error(`Error getting download URL for ${itemRef.name}:`, err)
                // No agregamos el item con error
              }
            }

            // Añadir un retraso más largo entre lotes
            if (i + 2 < items.length) {
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }
          }
          return results
        }

        // Procesar los items (archivos)
        const imageResults = await processItems(result.items)

        // Actualizar el estado con los nuevos resultados
        setImages((prev) => [...prev, ...(imageResults as ImageItem[])])

        // Verificar si hay más resultados para cargar (paginación)
        if (result.nextPageToken) {
          // Hay más resultados, pero no los cargamos automáticamente
          // para evitar sobrecargar Firebase
          setLoadedAll(false)
        } else {
          setLoadedAll(true)
        }
      } catch (err) {
        // Eliminar o comentar la línea que muestra el error
        // console.error("Error loading images from Firebase Storage:", err)
        setError(err instanceof Error ? err : new Error("Error desconocido al cargar imágenes"))
        setImages([])
      } finally {
        setLoading(false)
      }
    },
    [path],
  )

  // Función para cargar más imágenes (paginación)
  const loadMore = useCallback(async () => {
    if (loading || loadedAll) return

    try {
      setLoading(true)
      // Implementar la carga de la siguiente página
      // Esto es un placeholder, necesitarías implementar la lógica real
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setLoadedAll(true) // Por ahora, asumimos que ya cargamos todo
    } catch (err) {
      console.error("Error loading more images:", err)
    } finally {
      setLoading(false)
    }
  }, [loading, loadedAll])

  const uploadFile = async (file: File, uploadPath: string) => {
    if (!file) {
      return null
    }

    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      const storageRef = ref(storage, uploadPath)
      const uploadTask = uploadBytesResumable(storageRef, file)

      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            setProgress(progress)
          },
          (error) => {
            setError(error)
            setIsLoading(false)
            reject(error)
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            setUrl(downloadURL)
            setIsLoading(false)
            resolve(downloadURL)
          },
        )
      })
    } catch (err) {
      const error = err as Error
      setError(error)
      setIsLoading(false)
      throw error
    }
  }

  useEffect(() => {
    loadImages()
  }, [path, loadImages])

  return {
    images,
    folders,
    loading,
    error,
    refresh: () => loadImages(),
    loadMore,
    hasMore: !loadedAll,
    uploadFile,
    progress,
    isLoading,
    url,
  }
}

// Función de utilidad para subir imágenes sin usar el hook
export async function uploadImageToFirebase(file: File, path: string): Promise<string> {
  if (!file) {
    throw new Error("No file provided")
  }

  // Validar el tamaño del archivo (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("El archivo es demasiado grande. El tamaño máximo permitido es 5MB.")
  }

  // Validar el tipo de archivo
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!validTypes.includes(file.type)) {
    throw new Error("Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG, WEBP y GIF.")
  }

  // Sanitizar el nombre del archivo para evitar problemas con caracteres especiales
  const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_")
  const sanitizedPath = path.replace(/[^a-zA-Z0-9/_.-]/g, "_")

  try {
    console.log(`Subiendo archivo: ${fileName} a la ruta: ${sanitizedPath}`)

    // Crear una referencia al archivo en Firebase Storage
    const storageRef = ref(storage, sanitizedPath)

    // Iniciar la subida con manejo de errores mejorado
    const uploadTask = uploadBytesResumable(storageRef, file)

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Opcional: Reportar progreso
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log(`Progreso de subida: ${progress.toFixed(2)}%`)
        },
        (error) => {
          // Manejo de errores específicos
          console.error("Error al subir el archivo:", error)

          let errorMessage = "Error desconocido al subir el archivo."

          switch (error.code) {
            case "storage/unauthorized":
              errorMessage = "No tienes permisos para subir archivos a esta ubicación."
              break
            case "storage/canceled":
              errorMessage = "La subida fue cancelada."
              break
            case "storage/retry-limit-exceeded":
              errorMessage = "Se excedió el límite de reintentos. Verifica tu conexión a internet."
              break
            case "storage/invalid-checksum":
              errorMessage = "El archivo está corrupto o fue modificado durante la subida."
              break
            case "storage/unknown":
              errorMessage = "Error desconocido. Verifica la configuración de Firebase y los permisos."
              break
          }

          reject(new Error(errorMessage))
        },
        async () => {
          try {
            // Obtener la URL de descarga
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            console.log("Archivo subido exitosamente. URL:", downloadURL)
            resolve(downloadURL)
          } catch (error) {
            console.error("Error al obtener la URL de descarga:", error)
            reject(error)
          }
        },
      )
    })
  } catch (error) {
    console.error("Error en uploadImageToFirebase:", error)
    throw error
  }
}
