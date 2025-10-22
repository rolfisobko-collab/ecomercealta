import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')?.trim()
    const searchTerm = searchParams.get('q')?.trim()
    const category = searchParams.get('category')?.trim()
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100000)
    const skip = Math.max(Number(searchParams.get('skip')) || 0, 0)

    const query: any = {}
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { brand: { $regex: searchTerm, $options: 'i' } },
      ]
    }
    if (category) {
      query.$or = (query.$or || []).concat([
        { category: category },
        { categoryId: category },
      ])
    }

    // If id is provided: try to fetch a single product with diagnostics
    if (id) {
      const projectionSingle = {
        _id: 1,
        id: 1,
        name: 1,
        description: 1,
        price: 1,
        quantity: 1,
        stock: 1,
        category: 1,
        categoryId: 1,
        brand: 1,
        images: 1,
        image1: 1,
        location: 1,
        ubicacion: 1,
        updatedAt: 1,
      }
      const attempts: Array<{ collection: string; filter: any; matched: number }> = []
      const tryFindOne = async (collectionName: string) => {
        const col = db.collection(collectionName)
        let doc = await col.findOne({ _id: id as any }, { projection: projectionSingle })
        attempts.push({ collection: collectionName, filter: { _id: id }, matched: doc ? 1 : 0 })
        if (doc) return { doc, attempts }
        if (/^[a-fA-F0-9]{24}$/.test(id)) {
          try {
            const oid = new ObjectId(id)
            doc = await col.findOne({ _id: oid as any }, { projection: projectionSingle })
            attempts.push({ collection: collectionName, filter: { _id: 'ObjectId(' + id + ')' }, matched: doc ? 1 : 0 })
            if (doc) return { doc, attempts }
          } catch {}
        }
        doc = await col.findOne({ id: id as any }, { projection: projectionSingle })
        attempts.push({ collection: collectionName, filter: { id }, matched: doc ? 1 : 0 })
        if (doc) return { doc, attempts }
        if (/^\d+$/.test(id)) {
          const asNumber = Number(id)
          doc = await col.findOne({ _id: asNumber as any }, { projection: projectionSingle })
          attempts.push({ collection: collectionName, filter: { _id: asNumber }, matched: doc ? 1 : 0 })
          if (doc) return { doc, attempts }
          doc = await col.findOne({ id: asNumber as any }, { projection: projectionSingle })
          attempts.push({ collection: collectionName, filter: { id: asNumber }, matched: doc ? 1 : 0 })
          if (doc) return { doc, attempts }
        }
        return { doc: null as any, attempts }
      }

      const collections = ['stock','products','inventory','inventario','productos','items']
      let result = await tryFindOne(collections[0])
      for (let i = 1; !result.doc && i < collections.length; i++) {
        const r = await tryFindOne(collections[i])
        // merge attempts
        result.attempts.push(...r.attempts)
        if (r.doc) result = r
      }
      if (!result.doc) {
        return NextResponse.json({ message: 'Product not found', attempts: result.attempts }, { status: 404 })
      }
      const out = { ...result.doc, id: String(result.doc._id) }
      return NextResponse.json(out)
    }

    // Project only necessary fields for POS speed
    const projection = {
      _id: 1,
      name: 1,
      description: 1,
      price: 1,
      cost: 1,
      quantity: 1,
      stock: 1,
      category: 1,
      categoryId: 1,
      brand: 1,
      images: 1,
      image1: 1,
      location: 1,
      ubicacion: 1,
      updatedAt: 1,
    }

    // Aggregate across multiple collections to avoid missing items when one has a few docs
    const collections = ['stock','products','inventory','inventario','productos','items']
    const seen = new Set<string>()
    const aggregated: any[] = []
    const need = Math.max(0, skip) + limit

    for (let i = 0; i < collections.length; i++) {
      const colName = collections[i]
      try {
        const cursor = db.collection(colName)
          .find(query, { projection })
          .sort({ name: 1 })
          // Fetch up to the total needed to support global pagination
          .limit(need)
        const part = await cursor.toArray()
        for (const d of part) {
          const key = String(d._id)
          if (!seen.has(key)) {
            seen.add(key)
            aggregated.push(d)
            if (aggregated.length >= need) break
          }
        }
        if (aggregated.length >= need) break
      } catch {}
    }

    // As fallback, try via mongoose model to fill results if still scarce for the first page
    if (aggregated.length < need && skip === 0) {
      try {
        const { connectToMongoDB } = await import('@/lib/mongoose')
        const { Product } = await import('@/models/mongodb/Product')
        await connectToMongoDB()
        const mQuery: any = {}
        if (query.$or) mQuery.$or = query.$or
        if ((query as any).category) mQuery.category = (query as any).category
        const mDocs = await Product.find(mQuery)
          .sort({ name: 1 })
          .limit(need)
          .lean()
        for (const d of (mDocs as any[] || [])) {
          const key = String(d._id)
          if (!seen.has(key)) {
            seen.add(key)
            aggregated.push({
              _id: d._id,
              name: d.name,
              description: d.description,
              price: d.price,
              quantity: d.quantity,
              category: d.category,
              brand: d.brand,
              images: d.images,
              image1: d.image1,
              location: (d as any).location || (d as any).ubicacion,
              updatedAt: d.updatedAt,
            })
            if (aggregated.length >= need) break
          }
        }
      } catch {}
    }

    // Global pagination slice
    const page = aggregated.slice(skip, skip + limit)
    const formatted = page.map((d: any) => ({ ...d, id: String(d._id) }))
    return NextResponse.json(formatted)
  } catch (error) {
    console.error("/api/products GET error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[PUT /api/products] Incoming body:", body)
    
    // Validar datos requeridos
    if (!body.name || !body.price) {
      return NextResponse.json({ message: "Name and price are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("stock")

    // Preparar datos del producto
    const productData = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Si viene con _id, usar ese, sino generar uno nuevo
    const productId = body._id || body.id || new Date().getTime().toString()
    
    await collection.insertOne({ _id: productId, ...productData })

    return NextResponse.json({ 
      success: true, 
      id: productId,
      message: "Product created successfully" 
    })
  } catch (error) {
    console.error("/api/products POST error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const { id, ...updateData } = body
    updateData.updatedAt = new Date()

    const tryUpdate = async (collectionName: string) => {
      const attempts: Array<{ collection: string; filter: any; matched: number }> = []
      const col = db.collection(collectionName)
      let res = await col.updateOne({ _id: id as any }, { $set: updateData })
      attempts.push({ collection: collectionName, filter: { _id: id }, matched: res.matchedCount })
      if (res.matchedCount > 0) return { res, attempts }

      if (typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)) {
        try {
          const oid = new ObjectId(id)
          res = await col.updateOne({ _id: oid as any }, { $set: updateData })
          attempts.push({ collection: collectionName, filter: { _id: 'ObjectId(' + id + ')' }, matched: res.matchedCount })
          if (res.matchedCount > 0) return { res, attempts }
        } catch {}
      }

      res = await col.updateOne({ id: id as any }, { $set: updateData })
      attempts.push({ collection: collectionName, filter: { id }, matched: res.matchedCount })
      if (res.matchedCount > 0) return { res, attempts }

      const asNumber = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : undefined
      if (asNumber !== undefined) {
        res = await col.updateOne({ _id: asNumber as any }, { $set: updateData })
        attempts.push({ collection: collectionName, filter: { _id: asNumber }, matched: res.matchedCount })
        if (res.matchedCount > 0) return { res, attempts }

        res = await col.updateOne({ id: asNumber as any }, { $set: updateData })
        attempts.push({ collection: collectionName, filter: { id: asNumber }, matched: res.matchedCount })
        if (res.matchedCount > 0) return { res, attempts }
      }

      return { res, attempts }
    }

    // Try in multiple collections
    const collections = ['stock','products','inventory','inventario','productos','items']
    const attemptsAll: any[] = []
    let result = await tryUpdate(collections[0])
    attemptsAll.push(...result.attempts)
    for (let i = 1; result.res.matchedCount === 0 && i < collections.length; i++) {
      const r = await tryUpdate(collections[i])
      attemptsAll.push(...r.attempts)
      result = r
    }

    if (result.res.matchedCount === 0) {
      // Last-resort: try matching by metadata (name/brand/categoryId) if provided
      const metaFilters: any[] = []
      if (body?.name) {
        const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const normName = String(body.name).trim().replace(/\s+/g, ' ')
        const nameRegex = new RegExp(escapeRegex(normName), 'i')
        // Build a flexible filter
        const base: any = { name: { $regex: nameRegex } }
        if (body?.brand) {
          const normBrand = String(body.brand).trim().replace(/\s+/g, ' ')
          const brandRegex = new RegExp(escapeRegex(normBrand), 'i')
          base.brand = { $regex: brandRegex }
        }
        if (body?.categoryId) base.$or = [{ categoryId: body.categoryId }, { category: body.categoryId }]
        if (typeof body?.price === 'number') base.price = body.price
        metaFilters.push(base)
      }
      if (metaFilters.length > 0) {
        console.warn("[PUT /api/products] Trying metadata lookup with:", metaFilters)
        for (const colName of collections) {
          const col = (await connectToDatabase()).db.collection(colName)
          const found = await col.findOne({ $or: metaFilters })
          if (found) {
            const upd = await col.updateOne({ _id: found._id }, { $set: updateData })
            attemptsAll.push({ collection: colName, filter: { _id: String(found._id) + " (via meta)" }, matched: upd.matchedCount })
            if (upd.matchedCount > 0) {
              console.log("[PUT /api/products] Updated via metadata in:", { collection: colName, id: String(found._id) })
              return NextResponse.json({ success: true, message: "Product updated successfully (via metadata)", matched: { collection: colName, filter: { _id: String(found._id) } } })
            }
          }
        }
      }
      // As a pragmatic fallback, upsert by metadata into 'stock' to ensure POS can proceed
      if (metaFilters.length > 0) {
        const { db } = await connectToDatabase()
        const col = db.collection('stock')
        const upsertFilter = metaFilters.length > 1 ? { $or: metaFilters } : metaFilters[0]
        const upsertDoc: any = {
          ...updateData,
          name: body?.name ?? updateData?.name,
          brand: body?.brand ?? updateData?.brand,
          categoryId: body?.categoryId ?? updateData?.categoryId,
          category: body?.categoryId ?? updateData?.category,
          price: typeof body?.price === 'number' ? body.price : updateData?.price,
          updatedAt: new Date(),
        }
        if (!upsertDoc.createdAt) upsertDoc.createdAt = new Date()
        const up = await col.updateOne(upsertFilter as any, { $set: upsertDoc }, { upsert: true })
        console.warn("[PUT /api/products] UPSERT via metadata in 'stock':", { filter: upsertFilter, result: up })
        return NextResponse.json({ success: true, message: "Product upserted (via metadata)", upserted: { collection: 'stock', filter: upsertFilter, result: { matched: up.matchedCount, upsertedId: (up as any).upsertedId } } })
      }
      console.warn("[PUT /api/products] NOT FOUND. Attempts:", attemptsAll)
      return NextResponse.json({ message: "Product not found", attempts: attemptsAll }, { status: 404 })
    }

    const matched = attemptsAll.find(a => a.matched > 0)
    console.log("[PUT /api/products] Updated OK in:", matched)
    return NextResponse.json({ 
      success: true,
      message: "Product updated successfully",
      matched: { collection: matched?.collection, filter: matched?.filter }
    })
  } catch (error) {
    console.error("/api/products PUT error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("stock")

    const result = await collection.deleteOne({ _id: id as any })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully"
    })
  } catch (error: unknown) {
    console.error("/api/products DELETE error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 })
  }
}