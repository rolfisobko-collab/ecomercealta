import { NextResponse } from "next/server"
import { getAllCategories } from "@/services/mongodb/categoryService"

export async function GET() {
  try {
    const categories = await getAllCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error("/api/categories GET error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
