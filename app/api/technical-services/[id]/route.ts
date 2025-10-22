import { NextResponse } from 'next/server'
import { technicalServiceServiceMongo } from '@/services/mongodb/technicalServiceService'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const item = await technicalServiceServiceMongo.getById(params.id)
    if (!item) return new NextResponse('Not found', { status: 404 })
    return NextResponse.json(item)
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error fetching service', { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    await technicalServiceServiceMongo.update(params.id, body)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error updating service', { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await technicalServiceServiceMongo.delete(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error deleting service', { status: 500 })
  }
}
