import { NextResponse } from "next/server"
import { getUserFavorites, addToFavorites, removeFromFavorites } from "@/services/mongodb/favoriteService"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 })
    }

    const favorites = await getUserFavorites(userId)
    return NextResponse.json(favorites)
  } catch (error) {
    console.error("/api/favorites GET error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, productId } = body

    if (!userId || !productId) {
      return NextResponse.json({ message: "userId and productId are required" }, { status: 400 })
    }

    const success = await addToFavorites(userId, productId)
    return NextResponse.json({ success })
  } catch (error) {
    console.error("/api/favorites POST error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const productId = searchParams.get("productId")

    if (!userId || !productId) {
      return NextResponse.json({ message: "userId and productId are required" }, { status: 400 })
    }

    const success = await removeFromFavorites(userId, productId)
    return NextResponse.json({ success })
  } catch (error) {
    console.error("/api/favorites DELETE error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
