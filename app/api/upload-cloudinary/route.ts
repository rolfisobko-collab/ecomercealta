import { type NextRequest, NextResponse } from "next/server"

// Función para generar la firma usando Web Crypto API (compatible con Edge)
async function generateSignature(paramsToSign: string, apiSecret: string) {
  // Convertir las cadenas a ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(paramsToSign + apiSecret)

  // Generar el hash SHA-1
  const hashBuffer = await crypto.subtle.digest("SHA-1", data)

  // Convertir el ArrayBuffer a cadena hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex
}

export async function POST(request: NextRequest) {
  try {
    // CLAVES HARDCODEADAS
    const cloudName = "dudrd8wsy"
    const apiKey = "681677733729947"
    const apiSecret = "RxssL245CrMSPkxtH05jGaHPxwI"

    console.log("Usando claves hardcodeadas para Cloudinary")

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    // Crear un FormData para enviar a Cloudinary
    const cloudinaryFormData = new FormData()

    // Agregar el archivo
    cloudinaryFormData.append("file", file)

    // Parámetros para la firma
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const folder = "alta_telefonia"

    // Agregar parámetros al FormData
    cloudinaryFormData.append("api_key", apiKey)
    cloudinaryFormData.append("timestamp", timestamp)
    cloudinaryFormData.append("folder", folder)

    // Crear la cadena para firmar
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`

    // Generar la firma
    const signature = await generateSignature(paramsToSign, apiSecret)
    cloudinaryFormData.append("signature", signature)

    console.log("Parámetros de firma:", {
      timestamp,
      folder,
      signature: signature.substring(0, 10) + "...", // Solo mostrar parte de la firma por seguridad
    })

    // Hacer la solicitud a Cloudinary
    console.log("Enviando solicitud a Cloudinary con firma...")
    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: cloudinaryFormData,
    })

    // Manejar la respuesta
    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text()
      console.error("Error de Cloudinary:", errorText)
      return NextResponse.json({ error: `Error de Cloudinary: ${errorText}` }, { status: cloudinaryResponse.status })
    }

    const result = await cloudinaryResponse.json()
    console.log("Imagen subida exitosamente:", result.secure_url)

    return NextResponse.json({
      secure_url: result.secure_url,
      public_id: result.public_id,
    })
  } catch (error) {
    console.error("Error en la ruta de API:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
