import { NextResponse } from 'next/server'
import { technicalServiceServiceMongo } from '@/services/mongodb/technicalServiceService'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    await technicalServiceServiceMongo.updateBrand(params.id, body)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error updating brand', { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await technicalServiceServiceMongo.deleteBrand(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error deleting brand', { status: 500 })
  }
}
