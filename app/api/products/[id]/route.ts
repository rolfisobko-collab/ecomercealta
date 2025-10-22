import { NextResponse } from "next/server"
import { getProductById } from "@/services/mongodb/productService"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await getProductById(id)
    if (!product) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(product)
  } catch (error) {
    console.error("/api/products/[id] GET error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}


