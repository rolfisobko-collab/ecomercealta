import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0'

export async function GET() {
  let client: MongoClient | null = null
  
  try {
    // Conectar directamente sin caché
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db('test')
    
    console.log('🔍 Loading dashboard data from MongoDB...')
    
    // Cargar todas las colecciones en paralelo
    const [
      products,
      cashTransactions,
      sales,
      technicalServices
    ] = await Promise.all([
      db.collection('stock').find({}).toArray(),
      db.collection('cashTransactions').find({}).toArray(),
      db.collection('sales').find({}).toArray(),
      db.collection('technicalServices').find({}).toArray()
    ])

    console.log(`✅ Loaded: ${products.length} products, ${cashTransactions.length} transactions, ${sales.length} sales, ${technicalServices.length} services`)

    // Procesar datos
    const result = {
      products: products.map(p => {
        const { _id, ...rest } = p
        return { ...rest, id: _id }
      }),
      cashTransactions: cashTransactions.map(t => {
        const { _id, ...rest } = t
        return { ...rest, id: _id }
      }),
      sales: sales.map(s => {
        const { _id, ...rest } = s
        return { ...rest, id: _id }
      }),
      technicalServices: technicalServices.map(s => {
        const { _id, ...rest } = s
        return { ...rest, id: _id }
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ /api/dashboard-data error:", error)
    return NextResponse.json({ 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    if (client) {
      await client.close()
    }
  }
}
