import { NextResponse } from 'next/server'
import { technicalServiceServiceMongo } from '@/services/mongodb/technicalServiceService'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get('brandId')
    const list = brandId
      ? await technicalServiceServiceMongo.getModelsByBrand(brandId)
      : await technicalServiceServiceMongo.getAllModels()
    return NextResponse.json(list)
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error fetching models', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = await technicalServiceServiceMongo.createModel(body)
    return NextResponse.json(id)
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error creating model', { status: 500 })
  }
}
