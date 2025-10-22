import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// Collection name
const COLLECTION = 'sales'

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const url = new URL(req.url)
    const status = url.searchParams.get('status')

    const filter: any = {}
    if (status) filter.status = status

    const docs = await db.collection(COLLECTION).find(filter).sort({ createdAt: -1 }).limit(500).toArray()
    return NextResponse.json(docs)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error listing sales' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { db } = await connectToDatabase()

    const now = new Date()
    const doc = {
      saleNumber: body.saleNumber || `SALE-${now.getTime()}`,
      date: body.date || now.toLocaleDateString('es-AR'),
      time: body.time || now.toLocaleTimeString('es-AR'),
      items: body.items || [],
      subtotal: Number(body.subtotal || 0),
      total: Number(body.total || 0),
      currency: body.currency || 'USD',
      paymentMethod: body.paymentMethod || 'cash',
      status: body.status || 'pending',
      paymentDetails: body.paymentDetails || null,
      isService: !!body.isService,
      serviceId: body.serviceId || null,
      customerName: body.customerName || null,
      customerPhone: body.customerPhone || null,
      createdAt: now,
      paidAt: body.paidAt ? new Date(body.paidAt) : null,
      displayCurrency: body.displayCurrency || null,
      exchangeRate: body.exchangeRate || null,
      displayTotal: body.displayTotal || null,
    }

    const res = await db.collection(COLLECTION).insertOne(doc)
    return NextResponse.json({ id: res.insertedId, ...doc }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error creating sale' }, { status: 500 })
  }
}
