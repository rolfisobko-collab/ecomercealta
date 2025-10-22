import { NextResponse } from 'next/server'
import { technicalServiceServiceMongo } from '@/services/mongodb/technicalServiceService'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await technicalServiceServiceMongo.removeServiceProduct(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error deleting service product', { status: 500 })
  }
}
