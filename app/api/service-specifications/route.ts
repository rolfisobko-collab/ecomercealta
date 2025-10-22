import { NextResponse } from 'next/server'
import { technicalServiceServiceMongo } from '@/services/mongodb/technicalServiceService'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const serviceId = searchParams.get('serviceId')
    const brandId = searchParams.get('brandId')
    const modelId = searchParams.get('modelId')

    if (serviceId) {
      const list = await technicalServiceServiceMongo.getSpecificationsByService(serviceId)
      return NextResponse.json(list)
    }
    if (brandId && modelId) {
      const list = await technicalServiceServiceMongo.getSpecificationsByBrandAndModel(brandId, modelId)
      return NextResponse.json(list)
    }
    return new NextResponse('Missing query params', { status: 400 })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error fetching specifications', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = await technicalServiceServiceMongo.createSpecification(body)
    return NextResponse.json(id)
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error creating specification', { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const id = await technicalServiceServiceMongo.upsertSpecification(body)
    return NextResponse.json(id)
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error upserting specification', { status: 500 })
  }
}
