"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Phone, ChevronRight, Youtube, Facebook, Twitch, Copy, Check } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useTheme } from "next-themes"

export default function SiteFooter() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme } = useTheme()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean
    message?: string
  }>({})
  const [copied, setCopied] = useState(false)

  // Hide footer on admin, auth and gremio pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth") || pathname?.startsWith("/gremio")) {
    return null
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación básica del email
    if (!email || !email.includes("@") || !email.includes(".")) {
      setSubmitStatus({
        success: false,
        message: "Por favor, ingresa un correo electrónico válido.",
      })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus({})

    try {
      // Guardar en la colección "newsletters" en Firebase
      await addDoc(collection(db, "newsletters"), {
        email,
        createdAt: serverTimestamp(),
        source: "website_footer",
      })

      // Éxito
      setSubmitStatus({
        success: true,
        message: "¡Gracias por suscribirte!",
      })
      setEmail("")
    } catch (error) {
      console.error("Error al guardar el email:", error)
      setSubmitStatus({
        success: false,
        message: "Ocurrió un error. Inténtalo nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText("+5493764903766").then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <footer className="relative">
      {/* Línea decorativa superior */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-600"></div>

      {/* Fondo con gradiente sutil */}
      <div className="bg-white/80 dark:bg-gray-950/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800/50 pt-8 pb-6">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            {/* Logo */}
            <div className="md:w-1/4">
              <Link href="/" className="block transition hover:opacity-80">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Alta-negro-Photoroom-2-VWXcnw60P64byJRzm8JVx4zpZPZm2j.png"
                  alt="Alta Telefonía"
                  className={`h-12 md:h-14 w-auto ${theme === "dark" ? "filter invert brightness-[.85]" : ""}`}
                />
              </Link>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 hidden md:block">
                Tu tienda especializada en reparación y accesorios para dispositivos móviles.
              </p>
            </div>

            {/* Redes Sociales - Versión mejorada */}
            <div className="md:w-1/4">
              <h4 className="text-sm font-medium mb-4 text-gray-900 dark:text-gray-100 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 pb-2">
                Síguenos
              </h4>

              <div className="grid grid-cols-4 gap-3">
                {/* TikTok */}
                <Link
                  href="https://www.tiktok.com/@altatelefonia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-black text-white hover:scale-110 transition-all duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 448 512"
                    fill="currentColor"
                  >
                    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
                  </svg>
                  <span className="sr-only">TikTok</span>
                </Link>

                {/* WhatsApp */}
                <Link
                  href="https://wa.me/5493764903766"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-[#25D366] text-white hover:scale-110 transition-all duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 448 512"
                    fill="currentColor"
                  >
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                  </svg>
                  <span className="sr-only">WhatsApp</span>
                </Link>

                {/* Email */}
                <Link
                  href="mailto:altatelefonia2025@gmail.com"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-[#EA4335] text-white hover:scale-110 transition-all duration-300"
                >
                  <Mail size={18} />
                  <span className="sr-only">Email</span>
                </Link>

                {/* Instagram */}
                <Link
                  href="https://www.instagram.com/altatelefoniaexpress/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-tr from-[#FFDC80] via-[#E1306C] to-[#833AB4] text-white hover:scale-110 transition-all duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <span className="sr-only">Instagram</span>
                </Link>

                {/* YouTube */}
                <Link
                  href="https://www.youtube.com/@AltaTelefoniaARG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-[#FF0000] text-white hover:scale-110 transition-all duration-300"
                >
                  <Youtube size={18} />
                  <span className="sr-only">YouTube</span>
                </Link>

                {/* X (Twitter) */}
                <Link
                  href="https://x.com/altatelefo54074"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-black text-white hover:scale-110 transition-all duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="sr-only">X (Twitter)</span>
                </Link>

                {/* Facebook */}
                <Link
                  href="https://www.facebook.com/AltaTelefoniaAR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-[#1877F2] text-white hover:scale-110 transition-all duration-300"
                >
                  <Facebook size={18} />
                  <span className="sr-only">Facebook</span>
                </Link>

                {/* Twitch */}
                <Link
                  href="https://www.twitch.tv/altatelefonia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-[#9146FF] text-white hover:scale-110 transition-all duration-300"
                >
                  <Twitch size={18} />
                  <span className="sr-only">Twitch</span>
                </Link>
              </div>

              <div className="mt-5 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">+ 54 9 376 490-3766</span>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href="tel:+5493764903766"
                      className="p-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                      title="Llamar (requiere app de llamadas)"
                    >
                      <Phone size={14} />
                      <span className="sr-only">Llamar</span>
                    </a>
                    <button
                      onClick={copyPhoneNumber}
                      className="p-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      title="Copiar número"
                    >
                      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      <span className="sr-only">Copiar número</span>
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <a
                    href="https://wa.me/5493764903766"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-500 hover:underline"
                  >
                    También disponible en WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Enlaces - Versión simplificada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 md:w-2/4">
              {/* Categorías - Simplificado */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Categorías
                </h4>
                <ul className="space-y-2">
                  {[
                    { href: "/search?category=modulos", label: "Modulos", category: "modulos" },
                    { href: "/search?category=celular", label: "Celular", category: "celular" },
                    { href: "/search?category=baterias", label: "Baterías", category: "baterias" },
                    { href: "/search?category=camaras", label: "Cámaras", category: "camaras" },
                    { href: "/search?category=accesorios", label: "Accesorios", category: "accesorios" },
                    {
                      href: "/search?category=herramientas-insumos",
                      label: "Herramientas e insumos",
                      category: "herramientas-insumos",
                    },
                  ].map((link) => {
                    // Función para manejar el clic en categorías
                    const handleCategoryClick = (e) => {
                      // Si estamos en la página de búsqueda, prevenimos la navegación estándar
                      if (pathname === "/search") {
                        e.preventDefault()
                        // Usar el router para actualizar la URL sin recargar la página
                        router.push(`/search?category=${link.category}`)
                      }
                      // Si no estamos en la página de búsqueda, dejamos que el Link funcione normalmente
                    }

                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-sm flex items-center group transition-all duration-200"
                          onClick={handleCategoryClick}
                        >
                          <ChevronRight
                            size={14}
                            className="mr-1.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200"
                          />
                          {link.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Newsletter simplificado */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                  Suscríbete
                </h4>
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="Tu email"
                      className="h-9 text-sm pr-8"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9 rounded-l-none bg-red-500 hover:bg-red-600"
                      disabled={isSubmitting}
                    >
                      <Mail size={14} />
                      <span className="sr-only">Suscribirse</span>
                    </Button>
                  </div>
                  {submitStatus.message && (
                    <p
                      className={`text-xs ${
                        submitStatus.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {submitStatus.message}
                    </p>
                  )}
                </form>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Mantente al día con nuestras ofertas y novedades.
                </p>
              </div>
            </div>
          </div>

          {/* Copyright - Minimalista */}
          <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-800/50 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Alta Telefonía. Todos los derechos reservados.
            </p>
            <div className="flex mt-3 md:mt-0 space-x-4 md:space-x-6">
              {["Términos", "Privacidad"].map((item) => (
                <Link
                  key={item}
                  href="#"
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
