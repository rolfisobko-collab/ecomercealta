import { NextResponse } from 'next/server'
import { technicalServiceServiceMongo } from '@/services/mongodb/technicalServiceService'

export async function GET() {
  try {
    const list = await technicalServiceServiceMongo.getAll()
    return NextResponse.json(list)
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error fetching services', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = await technicalServiceServiceMongo.create(body)
    return NextResponse.json(id)
  } catch (e: any) {
    return new NextResponse(e?.message || 'Error creating service', { status: 500 })
  }
}
