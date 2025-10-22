import { NextResponse } from 'next/server'
import { technicalServiceServiceMongo } from '@/services/mongodb/technicalServiceService'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const serviceId = searchParams.get('serviceId')
    if (serviceId) {
      const list = await technicalServiceServiceMongo.getServiceProductsByService(serviceId)
      return NextResponse.json(list)
    }
    const grouped = await technicalServiceServiceMongo.getAllServiceProducts()
    return NextResponse.json(grouped)
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error fetching service products', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = await technicalServiceServiceMongo.addServiceProduct(body)
    return NextResponse.json(id)
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error adding service product', { status: 500 })
  }
}
