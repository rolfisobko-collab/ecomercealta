import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0"
const MONGODB_DB = process.env.MONGODB_DB || "test"

async function getDb() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(MONGODB_DB)
  return { client, db }
}

export async function GET() {
  let client: MongoClient | null = null
  try {
    const conn = await getDb()
    client = conn.client
    const { db } = conn
    const collection = db.collection("serviceRequests")
    const list = await collection.find({}).sort({ createdAt: -1 }).limit(200).toArray()
    await client.close()
    return NextResponse.json(list.map((x: any) => ({ ...x, id: x._id })))
  } catch (err: any) {
    if (client) await client.close()
    return new NextResponse(err?.message || "Failed to list service requests", { status: 500 })
  }
}

export async function POST(req: Request) {
  let client: MongoClient | null = null
  try {
    const body = await req.json()
    const required = ["brandId", "modelId", "issueId", "logisticsType"]
    for (const k of required) {
      if (!body?.[k]) return NextResponse.json({ message: `Missing field: ${k}` }, { status: 400 })
    }

    const conn = await getDb()
    client = conn.client
    const { db } = conn
    const collection = db.collection("serviceRequests")

    const toInsert = {
      brandId: String(body.brandId),
      modelId: String(body.modelId),
      issueId: String(body.issueId),
      selectedProductId: body.selectedProductId ? String(body.selectedProductId) : null,
      logisticsType: String(body.logisticsType),
      logisticsPrice: Number(body.logisticsPrice ?? 0),
      servicePrice: Number(body.servicePrice ?? 0),
      productPrice: Number(body.productPrice ?? 0),
      totalPrice: Number(body.totalPrice ?? 0),
      contact: body.contact || null,
      notes: body.notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
    }

    const res = await collection.insertOne(toInsert as any)

    return NextResponse.json({ success: true, id: res.insertedId })
  } catch (err: any) {
    if (client) await client.close()
    return new NextResponse(err?.message || "Failed to create service request", { status: 500 })
  }
}
