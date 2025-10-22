"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react"

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // En una aplicación real, aquí manejarías el envío del formulario
    setFormSubmitted(true)
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <img src="/images/logo.png" alt="TechFix Logo" className="h-12 w-auto" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contáctanos</h1>
        </div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          ¿Tienes preguntas o necesitas ayuda? ¡Estamos aquí para ayudarte!
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact Information */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Ponte en Contacto</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Nuestro amable equipo siempre está listo para ayudarte con cualquier pregunta o inquietud.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="mt-1 h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="font-medium">Teléfono</h3>
                  <p className="text-gray-500 dark:text-gray-400">(123) 456-7890</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lun-Vie 9am-7pm, Sáb 10am-5pm</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="mt-1 h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-gray-500 dark:text-gray-400">soporte@techfixreparaciones.com</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Responderemos lo antes posible</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="mt-1 h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="font-medium">Ubicación</h3>
                  <p className="text-gray-500 dark:text-gray-400">Calle Reparación 123, Ciudad Tech, TC 12345</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Visita nuestra tienda para servicio en persona
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="mt-1 h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="font-medium">Horario Comercial</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Lunes-Viernes: 9am - 7pm</p>
                    <p>Sábado: 10am - 5pm</p>
                    <p>Domingo: Cerrado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Nuestra Ubicación</h2>
            <div className="mt-4 aspect-video overflow-hidden rounded-lg border">
              {/* En una aplicación real, aquí insertarías un mapa de Google */}
              <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                <MapPin className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-gray-500">Mapa de Ubicación</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {formSubmitted ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
              </div>
              <h2 className="text-xl font-semibold">¡Mensaje Enviado!</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Gracias por contactarnos. Nos pondremos en contacto contigo lo antes posible.
              </p>
              <Button onClick={() => setFormSubmitted(false)} className="bg-red-600 hover:bg-red-700">
                Enviar Otro Mensaje
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold">Envíanos un Mensaje</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Completa el formulario a continuación y nos pondremos en contacto contigo lo antes posible.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="first-name" className="text-sm font-medium">
                      Nombre
                    </label>
                    <Input id="first-name" placeholder="Juan" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="last-name" className="text-sm font-medium">
                      Apellido
                    </label>
                    <Input id="last-name" placeholder="Pérez" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="juan.perez@ejemplo.com" required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Número de Teléfono
                  </label>
                  <Input id="phone" type="tel" placeholder="(123) 456-7890" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Asunto
                  </label>
                  <Input id="subject" placeholder="¿Cómo podemos ayudarte?" required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Mensaje
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Por favor, proporciona detalles sobre tu consulta..."
                    rows={5}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Mensaje
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
