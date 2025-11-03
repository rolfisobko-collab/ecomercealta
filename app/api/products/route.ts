import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getRedis } from "@/lib/redis"

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')?.trim()
    const searchTerm = searchParams.get('q')?.trim()
    const category = searchParams.get('category')?.trim()
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100000)
    const skip = Math.max(Number(searchParams.get('skip')) || 0, 0)

    // Redis cache: versioned key to allow global invalidation on writes
    const redis = getRedis()
    const ver = redis ? String((await redis.get('products:ver')) ?? '0') : '0'
    const cacheKey = redis
      ? `products:v${ver}:id=${id || ''}&q=${searchTerm || ''}&category=${category || ''}&limit=${limit}&skip=${skip}`
      : null

    if (redis && cacheKey) {
      const hit = await redis.get<string>(cacheKey)
      if (hit) {
        return NextResponse.json(JSON.parse(hit))
      }
    }

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
        liquidation: 1,
        weeklyOffer: 1,
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
      if (redis && cacheKey) {
        await redis.set(cacheKey, JSON.stringify(out), { ex: 60 })
      }
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
      liquidation: 1,
      weeklyOffer: 1,
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
              liquidation: (d as any).liquidation,
              weeklyOffer: (d as any).weeklyOffer,
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
    if (redis && cacheKey) {
      await redis.set(cacheKey, JSON.stringify(formatted), { ex: 60 })
    }
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

    // Invalidate cache by bumping version
    try { const redis = getRedis(); if (redis) await redis.incr('products:ver') } catch {}

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
      // Optional UPSERT guard (to avoid duplicates by default)
      const allowMetaUpsert = process.env.METADATA_UPSERT === 'true'
      if (allowMetaUpsert && metaFilters.length > 0) {
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
    // Invalidate cache and update featured lists in Redis (write-through) and mirror Mongo collections
    try {
      const redis = getRedis()
      if (redis) {
        await redis.incr('products:ver')
        const idStr = String(body.id)
        const lKey = 'featured:liquidation:list'
        const wKey = 'featured:weekly:list'
        const [lRaw, wRaw] = await Promise.all([
          redis.get<string>(lKey),
          redis.get<string>(wKey),
        ])
        const lList: any[] = lRaw ? JSON.parse(lRaw) : []
        const wList: any[] = wRaw ? JSON.parse(wRaw) : []
        const upsert = (list: any[], obj: any) => {
          const idx = list.findIndex((x: any) => String(x.id) === idStr)
          if (idx >= 0) list[idx] = { ...list[idx], ...obj }
          else list.unshift(obj)
          return list.slice(0, 200)
        }
        const removeById = (list: any[]) => list.filter((x: any) => String(x.id) !== idStr)

        // Ensure we have real fields; otherwise fetch from DB
        const ensureFields = async () => {
          const haveName = (body?.name ?? updateData?.name) !== undefined
          const havePrice = typeof (body?.price ?? updateData?.price) === 'number'
          const haveImage = (body?.image1 ?? updateData?.image1) !== undefined || Array.isArray(body?.images) || Array.isArray(updateData?.images)
          if (haveName && havePrice && haveImage) {
            return {
              name: body?.name ?? updateData?.name,
              price: typeof body?.price === 'number' ? body.price : updateData?.price,
              image1: body?.image1 ?? updateData?.image1,
              images: Array.isArray(body?.images) ? body.images : (Array.isArray(updateData?.images) ? updateData.images : []),
            }
          }
          const { db } = await connectToDatabase()
          const projection = { _id: 1, name: 1, price: 1, image1: 1, images: 1, updatedAt: 1 }
          const collections = ['stock','products','inventory','inventario','productos','items']
          for (const colName of collections) {
            const col = db.collection(colName)
            let doc = await col.findOne({ _id: idStr as any }, { projection })
            if (!doc) { try { const oid = new ObjectId(idStr); doc = await col.findOne({ _id: oid as any }, { projection }) } catch {} }
            if (!doc) doc = await col.findOne({ id: idStr as any }, { projection })
            if (doc) return { name: doc.name, price: doc.price, image1: (doc as any).image1, images: (doc as any).images }
          }
          return null
        }
        const fields = await ensureFields()
        const model: any = fields ? {
          id: idStr,
          name: fields.name,
          price: fields.price,
          image1: fields.image1,
          images: Array.isArray(fields.images) ? fields.images : [],
          updatedAt: updateData?.updatedAt,
        } : null

        if (Object.prototype.hasOwnProperty.call(updateData, 'liquidation')) {
          const flag = Boolean(updateData.liquidation)
          if (flag && model && model.name && typeof model.price === 'number' && model.price > 0) {
            const next = upsert(lList, { ...model, liquidation: true })
            await redis.set(lKey, JSON.stringify(next))
          } else {
            const next = removeById(lList)
            await redis.set(lKey, JSON.stringify(next))
          }
          // If liquidation turned on, ensure weekly is removed (mutual exclusivity)
          if (flag) {
            const nextW = removeById(wList)
            await redis.set(wKey, JSON.stringify(nextW))
          }
        }
        if (Object.prototype.hasOwnProperty.call(updateData, 'weeklyOffer')) {
          const flag = Boolean(updateData.weeklyOffer)
          if (flag && model && model.name && typeof model.price === 'number' && model.price > 0) {
            const next = upsert(wList, { ...model, weeklyOffer: true })
            await redis.set(wKey, JSON.stringify(next))
          } else {
            const next = removeById(wList)
            await redis.set(wKey, JSON.stringify(next))
          }
          // If weekly turned on, ensure liquidation is removed (mutual exclusivity)
          if (flag) {
            const nextL = removeById(lList)
            await redis.set(lKey, JSON.stringify(nextL))
          }
        }
      }
      // Mirror to compact Mongo collections for ultra-fast reads
      try {
        const idStr = String(body.id)
        const ensureFields = async () => {
          const haveName = (body?.name ?? updateData?.name) !== undefined
          const havePrice = typeof (body?.price ?? updateData?.price) === 'number'
          const haveImage = (body?.image1 ?? updateData?.image1) !== undefined || Array.isArray(body?.images) || Array.isArray(updateData?.images)
          if (haveName && havePrice && haveImage) {
            return {
              name: body?.name ?? updateData?.name,
              price: typeof body?.price === 'number' ? body.price : updateData?.price,
              image1: body?.image1 ?? updateData?.image1,
              images: Array.isArray(body?.images) ? body.images : (Array.isArray(updateData?.images) ? updateData.images : []),
            }
          }
          // fetch from DB to avoid blank entries
          const { db } = await connectToDatabase()
          const projection = { _id: 1, name: 1, price: 1, image1: 1, images: 1, updatedAt: 1 }
          const collections = ['stock','products','inventory','inventario','productos','items']
          for (const colName of collections) {
            const col = db.collection(colName)
            let doc = await col.findOne({ _id: idStr as any }, { projection })
            if (!doc) {
              try { const oid = new ObjectId(idStr); doc = await col.findOne({ _id: oid as any }, { projection }) } catch {}
            }
            if (!doc) doc = await col.findOne({ id: idStr as any }, { projection })
            if (doc) return { name: doc.name, price: doc.price, image1: (doc as any).image1, images: (doc as any).images }
          }
          return null
        }
        const fields = await ensureFields()
        if (fields) {
          const minimalDoc: any = {
            _id: idStr,
            name: fields.name ?? '',
            price: Number(fields.price ?? 0),
            image1: fields.image1,
            images: Array.isArray(fields.images) ? fields.images : [],
            updatedAt: new Date(),
          }
          const { db } = await connectToDatabase()
          if (Object.prototype.hasOwnProperty.call(updateData, 'liquidation')) {
            const flag = Boolean(updateData.liquidation)
            const col = db.collection('featured_liquidation')
            if (flag) {
              await col.updateOne({ _id: minimalDoc._id }, { $set: minimalDoc }, { upsert: true })
            } else {
              await col.deleteOne({ _id: minimalDoc._id })
            }
          }
          if (Object.prototype.hasOwnProperty.call(updateData, 'weeklyOffer')) {
            const flag = Boolean(updateData.weeklyOffer)
            const col = db.collection('featured_weekly')
            if (flag) {
              await col.updateOne({ _id: minimalDoc._id }, { $set: minimalDoc }, { upsert: true })
            } else {
              await col.deleteOne({ _id: minimalDoc._id })
            }
          }
          // Enforce mutual exclusivity at compact collections level
          if (Object.prototype.hasOwnProperty.call(updateData, 'liquidation') && Boolean(updateData.liquidation)) {
            await db.collection('featured_weekly').deleteOne({ _id: minimalDoc._id })
          }
          if (Object.prototype.hasOwnProperty.call(updateData, 'weeklyOffer') && Boolean(updateData.weeklyOffer)) {
            await db.collection('featured_liquidation').deleteOne({ _id: minimalDoc._id })
          }
        }
      } catch {}
      // Propagate flags across all collections to avoid inconsistency in admin filters
      try {
        const { db } = await connectToDatabase()
        const idStr = String(body.id)
        const flagSet: any = {}
        if (Object.prototype.hasOwnProperty.call(updateData, 'weeklyOffer')) flagSet.weeklyOffer = Boolean(updateData.weeklyOffer)
        if (Object.prototype.hasOwnProperty.call(updateData, 'liquidation')) flagSet.liquidation = Boolean(updateData.liquidation)
        if (Object.keys(flagSet).length > 0) {
          const collections = ['stock','products','inventory','inventario','productos','items']
          for (const colName of collections) {
            const col = db.collection(colName)
            await col.updateOne({ _id: idStr as any }, { $set: flagSet })
            try { const oid = new ObjectId(idStr); await col.updateOne({ _id: oid as any }, { $set: flagSet }) } catch {}
            await col.updateOne({ id: idStr as any }, { $set: flagSet })
          }
          // If one flag is true, force the other to false across bases
          if (Object.prototype.hasOwnProperty.call(updateData, 'liquidation') && Boolean(updateData.liquidation)) {
            const unsetWeekly = { $set: { weeklyOffer: false } }
            for (const colName of ['stock','products','inventory','inventario','productos','items']) {
              const col = db.collection(colName)
              await col.updateOne({ _id: idStr as any }, unsetWeekly)
              try { const oid = new ObjectId(idStr); await col.updateOne({ _id: oid as any }, unsetWeekly) } catch {}
              await col.updateOne({ id: idStr as any }, unsetWeekly)
            }
          }
          if (Object.prototype.hasOwnProperty.call(updateData, 'weeklyOffer') && Boolean(updateData.weeklyOffer)) {
            const unsetLiquidation = { $set: { liquidation: false } }
            for (const colName of ['stock','products','inventory','inventario','productos','items']) {
              const col = db.collection(colName)
              await col.updateOne({ _id: idStr as any }, unsetLiquidation)
              try { const oid = new ObjectId(idStr); await col.updateOne({ _id: oid as any }, unsetLiquidation) } catch {}
              await col.updateOne({ id: idStr as any }, unsetLiquidation)
            }
          }
        }
      } catch {}
    } catch {}
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

    // Invalidate cache
    try { const redis = getRedis(); if (redis) await redis.incr('products:ver') } catch {}
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