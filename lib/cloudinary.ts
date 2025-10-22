// Función para subir una imagen a Cloudinary a través de nuestra API
export async function uploadToCloudinary(file: File): Promise<any> {
  try {
    console.log(`Preparando para subir ${file.name} a Cloudinary...`)

    // Crear un FormData para la carga
    const formData = new FormData()
    formData.append("file", file)

    // Usar nuestra ruta de API para manejar la carga a Cloudinary
    const response = await fetch("/api/upload-cloudinary", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Error al subir a Cloudinary: ${response.status} ${errorData.error || "Error desconocido"}`)
    }

    const data = await response.json()
    console.log("Imagen subida exitosamente a Cloudinary:", data.secure_url)

    // Extraer el nombre del archivo de la URL
    const urlParts = data.secure_url.split("/")
    const filename = urlParts[urlParts.length - 1]

    return {
      secure_url: data.secure_url,
      filename: filename,
    }
  } catch (error) {
    console.error("Error al subir imagen a Cloudinary:", error)
    throw error
  }
}
