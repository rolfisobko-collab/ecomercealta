import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// Asegurarnos de que la importación sea correcta
import ProductImage from "@/components/product/ProductImage"

export default function FeaturedProducts() {
  const featuredProducts = [
    {
      id: 1,
      name: "iPhone 13 Pro",
      description: "Smartphone Apple con pantalla Super Retina XDR de 6.1 pulgadas",
      price: "999,99€",
      image: "/placeholder.svg?height=200&width=300",
      badge: "Nuevo",
    },
    {
      id: 2,
      name: "Samsung Galaxy S22",
      description: "Potente smartphone con cámara de 108MP y pantalla Dynamic AMOLED",
      price: "849,99€",
      image: "/placeholder.svg?height=200&width=300",
      badge: "Oferta",
    },
    {
      id: 3,
      name: "Xiaomi Redmi Note 11",
      description: "Gran relación calidad-precio con batería de 5000mAh",
      price: "279,99€",
      image: "/placeholder.svg?height=200&width=300",
      badge: "Más Vendido",
    },
    {
      id: 4,
      name: "Auriculares Bluetooth Sony WH-1000XM4",
      description: "Cancelación de ruido líder en la industria y 30 horas de batería",
      price: "349,99€",
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Productos Destacados</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Descubre nuestra selección de los mejores smartphones y accesorios
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="group">
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="relative">
                  {product.badge && <Badge className="absolute top-2 right-2 z-10 bg-red-600">{product.badge}</Badge>}
                  <ProductImage
                    product={product}
                    className="aspect-[3/2] w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.description}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex items-center justify-between">
                  <span className="font-bold">{product.price}</span>
                  <Badge variant="outline" className="group-hover:bg-red-600 group-hover:text-white transition-colors">
                    Ver Detalles
                  </Badge>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
        <div className="flex justify-center">
          <Link
            href="/products"
            className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-700 disabled:pointer-events-none disabled:opacity-50"
          >
            Ver Todos los Productos
          </Link>
        </div>
      </div>
    </section>
  )
}
