import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock, Shield, Users, CheckCircle } from "lucide-react"

export default function AboutPage() {
  const team = [
    {
      name: "Miguel Jiménez",
      role: "Fundador y Técnico Principal",
      bio: "Con más de 15 años de experiencia en reparación de dispositivos móviles, Miguel fundó TechFix para proporcionar servicios de reparación de alta calidad a precios asequibles.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Sara Martínez",
      role: "Técnica Senior de Reparación",
      bio: "Sara se especializa en microsoldadura y reparaciones a nivel de placa. Ha reparado miles de dispositivos y ha formado a muchos técnicos.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "David García",
      role: "Gerente de Atención al Cliente",
      bio: "David se asegura de que cada cliente reciba un servicio excepcional. Gestiona nuestra recepción y coordina los horarios de reparación.",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Elena Rodríguez",
      role: "Especialista en Piezas",
      bio: "Elena busca las piezas de repuesto de la más alta calidad para todas las reparaciones. Se asegura de que siempre tengamos los componentes adecuados en stock.",
      image: "/placeholder.svg?height=300&width=300",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-red-50 to-rose-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Sobre TechFix Reparaciones</h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Tu socio de confianza para servicios profesionales de reparación de dispositivos móviles desde 2010.
                </p>
              </div>
            </div>
            <img
              src="/placeholder.svg?height=400&width=600"
              alt="Nuestra tienda de reparación"
              width={600}
              height={400}
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
            />
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <img
              src="/placeholder.svg?height=400&width=600"
              alt="Nuestro viaje"
              width={600}
              height={400}
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
            />
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img src="/images/logo.png" alt="TechFix Logo" className="h-12 w-auto" />
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Nuestra Historia</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  TechFix Reparaciones fue fundada en 2010 con una misión simple: proporcionar servicios de reparación
                  rápidos, confiables y asequibles para todos los dispositivos móviles. Lo que comenzó como una pequeña
                  tienda de reparación se ha convertido en un centro de servicio de confianza con múltiples ubicaciones.
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Nuestro fundador, Miguel Jiménez, comenzó a reparar teléfonos como pasatiempo mientras estudiaba
                  ingeniería. Después de ver los altos precios y los largos tiempos de espera en los centros de servicio
                  de los fabricantes, decidió crear una mejor alternativa.
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Hoy, estamos orgullosos de haber ayudado a más de 50,000 clientes a recuperar sus dispositivos en
                  perfecto estado. Nuestro equipo de técnicos certificados continúa manteniendo nuestro compromiso con
                  reparaciones de calidad y servicio al cliente excepcional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Nuestros Valores</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Los principios que guían todo lo que hacemos
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <div className="p-2 bg-red-50 rounded-full dark:bg-red-900/20">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold">Calidad</h3>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                Utilizamos solo piezas y herramientas de la más alta calidad para todas nuestras reparaciones,
                asegurando que tu dispositivo funcione como nuevo.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <div className="p-2 bg-red-50 rounded-full dark:bg-red-900/20">
                <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold">Eficiencia</h3>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                Respetamos tu tiempo y nos esforzamos por completar la mayoría de las reparaciones en 30-60 minutos
                mientras esperas.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <div className="p-2 bg-red-50 rounded-full dark:bg-red-900/20">
                <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold">Enfoque al Cliente</h3>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                Tratamos a cada cliente y dispositivo con cuidado y respeto, proporcionando consejos honestos y precios
                transparentes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Conoce a Nuestro Equipo</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Nuestros técnicos capacitados y personal amable están aquí para ayudarte
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-4">
            {team.map((member, index) => (
              <div key={index} className="flex flex-col items-center space-y-4">
                <div className="overflow-hidden rounded-full">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    width={150}
                    height={150}
                    className="aspect-square object-cover"
                  />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">{member.role}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">¿Por Qué Elegirnos?</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Estamos comprometidos a proporcionar la mejor experiencia de reparación posible. Esto es lo que nos
                  distingue:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 text-green-600 dark:text-green-500" />
                    <span>Técnicos certificados con años de experiencia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 text-green-600 dark:text-green-500" />
                    <span>Garantía de 90 días en todas las piezas y mano de obra</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 text-green-600 dark:text-green-500" />
                    <span>Precios transparentes sin cargos ocultos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 text-green-600 dark:text-green-500" />
                    <span>La mayoría de las reparaciones se completan en 30-60 minutos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 text-green-600 dark:text-green-500" />
                    <span>Revisiones de diagnóstico gratuitas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-1 h-5 w-5 text-green-600 dark:text-green-500" />
                    <span>Ubicación conveniente con amplio estacionamiento</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
                  <Link href="/services">Nuestros Servicios</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/contact">Contáctanos</Link>
                </Button>
              </div>
            </div>
            <img
              src="/placeholder.svg?height=400&width=600"
              alt="Interior de nuestra tienda de reparación"
              width={600}
              height={400}
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-red-600 dark:bg-red-900">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="flex flex-col items-center justify-center space-y-2 text-center text-white">
              <div className="text-4xl font-bold">+50K</div>
              <div className="text-sm font-medium">Dispositivos Reparados</div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 text-center text-white">
              <div className="text-4xl font-bold">+12</div>
              <div className="text-sm font-medium">Años de Experiencia</div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 text-center text-white">
              <div className="text-4xl font-bold">+15</div>
              <div className="text-sm font-medium">Técnicos Certificados</div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 text-center text-white">
              <div className="text-4xl font-bold">98%</div>
              <div className="text-sm font-medium">Satisfacción del Cliente</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">¿Listo para Reparar tu Dispositivo?</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Visita nuestra tienda o contáctanos hoy para recuperar tu dispositivo en perfecto estado
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
                <Link href="/services">Ver Servicios</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">Contáctanos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
