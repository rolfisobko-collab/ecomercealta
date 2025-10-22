import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongodb'

const COLLECTION = 'sales'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = await context.params
    const doc = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) })
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(doc)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error getting sale' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { db } = await connectToDatabase()
    const body = await req.json()
    const update: any = { ...body, updatedAt: new Date() }
    if (body.paidAt === true) update.paidAt = new Date() // shorthand
    if (typeof body.paidAt === 'string') update.paidAt = new Date(body.paidAt)

    // Try by ObjectId if looks like 24-hex
    const { id } = await context.params
    const isHex24 = /^[a-fA-F0-9]{24}$/.test(id)
    if (isHex24) {
      try {
        const res = await db.collection(COLLECTION).findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: update },
          { returnDocument: 'after' },
        )
        if (res && res.value) return NextResponse.json(res.value)
      } catch {}
    }

    // Fallback: by saleNumber
    const byNumber = await db.collection(COLLECTION).findOneAndUpdate(
      { saleNumber: id },
      { $set: update },
      { returnDocument: 'after' },
    )
    if (byNumber && byNumber.value) return NextResponse.json(byNumber.value)

    // Fallback: by 'id' field (if any)
    const byAltId = await db.collection(COLLECTION).findOneAndUpdate(
      { id: id as any },
      { $set: update },
      { returnDocument: 'after' },
    )
    if (byAltId && byAltId.value) return NextResponse.json(byAltId.value)

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error updating sale' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = await context.params
    const res = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) })
    if (!res.deletedCount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error deleting sale' }, { status: 500 })
  }
}
