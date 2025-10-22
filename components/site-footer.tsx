import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react"

export default function SiteFooter() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900">
      {/* Newsletter Section */}
      <div className="container px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tighter">Mantente Actualizado</h3>
              <p className="text-gray-500 dark:text-gray-400 md:text-lg">
                Suscríbete a nuestro boletín para recibir los últimos consejos de reparación, ofertas especiales y
                noticias tecnológicas.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <form className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
              <Input type="email" placeholder="Ingresa tu email" className="flex-1" required />
              <Button type="submit" className="bg-red-600 hover:bg-red-700">
                Suscribirse
              </Button>
            </form>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Al suscribirte, aceptas nuestros Términos de Servicio y Política de Privacidad.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="border-t bg-gray-50 dark:bg-gray-950 dark:border-gray-800">
        <div className="container px-4 py-12 md:px-6 md:py-16">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-4">
              <div className="block ml-4">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Alta-negro-Photoroom-2-VWXcnw60P64byJRzm8JVx4zpZPZm2j.png"
                  alt="Alta Telefonía"
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Servicios profesionales de reparación de dispositivos móviles con piezas de calidad y técnicos expertos.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500">
                  <Facebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </Link>
                <Link href="#" className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link href="#" className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500">
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Link>
                <Link href="#" className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500">
                  <Youtube className="h-5 w-5" />
                  <span className="sr-only">YouTube</span>
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li>
                  <Link href="/" className="hover:text-red-600 dark:hover:text-red-500">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="hover:text-red-600 dark:hover:text-red-500">
                    Servicios
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="hover:text-red-600 dark:hover:text-red-500">
                    Productos
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-red-600 dark:hover:text-red-500">
                    Nosotros
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-red-600 dark:hover:text-red-500">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-red-600 dark:hover:text-red-500">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Servicios</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li>
                  <Link href="/services/screen-repair" className="hover:text-red-600 dark:hover:text-red-500">
                    Reparación de Pantalla
                  </Link>
                </li>
                <li>
                  <Link href="/services/battery-replacement" className="hover:text-red-600 dark:hover:text-red-500">
                    Cambio de Batería
                  </Link>
                </li>
                <li>
                  <Link href="/services/water-damage" className="hover:text-red-600 dark:hover:text-red-500">
                    Reparación por Daño de Agua
                  </Link>
                </li>
                <li>
                  <Link href="/services/charging-port" className="hover:text-red-600 dark:hover:text-red-500">
                    Reparación Puerto de Carga
                  </Link>
                </li>
                <li>
                  <Link href="/services/data-recovery" className="hover:text-red-600 dark:hover:text-red-500">
                    Recuperación de Datos
                  </Link>
                </li>
                <li>
                  <Link href="/services/diagnostics" className="hover:text-red-600 dark:hover:text-red-500">
                    Diagnósticos
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Contáctanos</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-red-600 shrink-0" />
                  <span>Calle Reparación 123, Ciudad Tech, TC 12345</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-red-600 shrink-0" />
                  <span>(123) 456-7890</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-red-600 shrink-0" />
                  <span>soporte@altatelefonia.com</span>
                </li>
              </ul>
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Horario Comercial</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Lunes-Viernes: 9am - 7pm
                  <br />
                  Sábado: 10am - 5pm
                  <br />
                  Domingo: Cerrado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t bg-gray-100 dark:bg-gray-950 dark:border-gray-800">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Alta Telefonía. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/terms" className="hover:text-red-600 dark:hover:text-red-500">
              Términos de Servicio
            </Link>
            <Link href="/privacy" className="hover:text-red-600 dark:hover:text-red-500">
              Política de Privacidad
            </Link>
            <Link href="/sitemap" className="hover:text-red-600 dark:hover:text-red-500">
              Mapa del Sitio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
