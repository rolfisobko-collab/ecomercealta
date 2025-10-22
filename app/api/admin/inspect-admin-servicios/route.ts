import { NextResponse } from "next/server"
import { technicalServiceService } from "@/services/hybrid/technicalServiceService"
import { productService } from "@/services/hybrid/productService"

export async function GET() {
  try {
    const [services, products, serviceProductsGrouped] = await Promise.all([
      technicalServiceService.getAll(),
      productService.getAll(),
      technicalServiceService.getAllServiceProducts(),
    ])

    return NextResponse.json({ services, products, serviceProductsGrouped })
  } catch (err: any) {
    return new NextResponse(err?.message || "Failed to inspect admin servicios payload", { status: 500 })
  }
}
