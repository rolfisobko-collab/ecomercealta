import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0"
const MONGODB_DB = process.env.MONGODB_DB || "test"

async function getDb() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(MONGODB_DB)
  return { client, db }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let client: MongoClient | null = null
  try {
    const id = params.id
    const body = await req.json()
    const allowed = ["status", "notes"] as const
    const update: Record<string, any> = {}
    for (const k of allowed) if (k in body) update[k] = body[k]
    update.updatedAt = new Date()

    const conn = await getDb()
    client = conn.client
    const { db } = conn
    const col = db.collection("serviceRequests")

    const res = await col.updateOne({ _id: new ObjectId(id) as any }, { $set: update })
    if (res.matchedCount === 0) return new NextResponse("Not found", { status: 404 })

    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    if (client) await client.close()
    return new NextResponse(err?.message || "Failed to update request", { status: 500 })
  }
}
