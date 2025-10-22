import { NextResponse } from 'next/server'
import { technicalServiceServiceMongo } from '@/services/mongodb/technicalServiceService'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    await technicalServiceServiceMongo.updateSpecification(params.id, body)
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error updating specification', { status: 500 })
  }
}
