import { NextResponse } from 'next/server'
import { technicalServiceServiceMongo } from '@/services/mongodb/technicalServiceService'

export async function GET() {
  try {
    const list = await technicalServiceServiceMongo.getAllBrands()
    return NextResponse.json(list)
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error fetching brands', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = await technicalServiceServiceMongo.createBrand(body)
    return NextResponse.json(id)
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error creating brand', { status: 500 })
  }
}
