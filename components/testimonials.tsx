import { Card, CardContent } from "@/components/ui/card"
import { StarIcon } from "lucide-react"

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Sara Martínez",
      role: "Usuario de iPhone",
      content: "El servicio de reemplazo de pantalla fue rápido y asequible. ¡Mi teléfono se ve como nuevo otra vez!",
      rating: 5,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      name: "Miguel Fernández",
      role: "Propietario de Samsung Galaxy",
      content:
        "Después de daños por agua, pensé que mi teléfono estaba perdido. Estos chicos recuperaron todos mis datos y lo arreglaron completamente.",
      rating: 5,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 3,
      name: "Elena Rodríguez",
      role: "Dueña de Negocio",
      content:
        "Utilizamos sus servicios para todos los dispositivos de nuestra empresa. Profesionales, confiables y siempre puntuales.",
      rating: 4,
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Testimonios de Clientes</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Mira lo que nuestros clientes satisfechos dicen sobre nuestros servicios
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <img
                  src={testimonial.image || "/placeholder.svg"}
                  alt={testimonial.name}
                  width={100}
                  height={100}
                  className="rounded-full aspect-square object-cover"
                />
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <p className="text-gray-500 dark:text-gray-400">"{testimonial.content}"</p>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
