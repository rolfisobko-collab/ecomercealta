import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Tablet, Laptop, Battery, Droplet, Zap, Camera, Wifi } from "lucide-react"

export default function ServiceCategories() {
  const categories = [
    {
      id: 1,
      name: "Reparación de Pantallas",
      description: "Pantallas rotas o agrietadas para todos los dispositivos",
      icon: <Smartphone className="h-8 w-8 text-red-600 dark:text-red-400" />,
      link: "/categories/screen-repairs",
    },
    {
      id: 2,
      name: "Cambio de Batería",
      description: "Extiende la vida de tu dispositivo con una batería nueva",
      icon: <Battery className="h-8 w-8 text-red-600 dark:text-red-400" />,
      link: "/categories/battery-replacement",
    },
    {
      id: 3,
      name: "Daños por Agua",
      description: "Recuperación y reparación de dispositivos dañados por agua",
      icon: <Droplet className="h-8 w-8 text-red-600 dark:text-red-400" />,
      link: "/categories/water-damage",
    },
    {
      id: 4,
      name: "Problemas de Carga",
      description: "Reparación de puertos de carga y problemas de energía",
      icon: <Zap className="h-8 w-8 text-red-600 dark:text-red-400" />,
      link: "/categories/charging-issues",
    },
    {
      id: 5,
      name: "Reparación de Cámaras",
      description: "Soluciona cámaras borrosas o que no funcionan",
      icon: <Camera className="h-8 w-8 text-red-600 dark:text-red-400" />,
      link: "/categories/camera-repairs",
    },
    {
      id: 6,
      name: "Reparación de Tablets",
      description: "Reparaciones especializadas para todos los modelos de tablets",
      icon: <Tablet className="h-8 w-8 text-red-600 dark:text-red-400" />,
      link: "/categories/tablet-repairs",
    },
    {
      id: 7,
      name: "Servicios para Laptops",
      description: "Reparaciones y actualizaciones para laptops",
      icon: <Laptop className="h-8 w-8 text-red-600 dark:text-red-400" />,
      link: "/categories/laptop-services",
    },
    {
      id: 8,
      name: "Problemas de Red",
      description: "Soluciona problemas de WiFi, Bluetooth y conectividad",
      icon: <Wifi className="h-8 w-8 text-red-600 dark:text-red-400" />,
      link: "/categories/network-issues",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Categorías de Servicios</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Explora nuestra amplia gama de servicios de reparación
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={category.link} className="group">
              <Card className="overflow-hidden transition-all hover:shadow-md hover:border-red-200 dark:hover:border-red-800">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="p-3 bg-red-50 rounded-full dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                    {category.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{category.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
