#!/usr/bin/env node

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

const { initializeApp, getApps, getApp } = require('firebase/app')
const { getFirestore, collection, getDocs, query, orderBy } = require('firebase/firestore')

// Definir esquemas mínimos aquí para evitar depender de archivos TS/ESM
function registerModels(mongoose) {
  const productSchema = new mongoose.Schema(
    {
      _id: { type: String },
      name: String,
      description: String,
      markdownDescription: String,
      price: Number,
      cost: Number,
      currency: String,
      quantity: Number,
      category: String,
      location: String,
      obs: String,
      images: [String],
      image1: String,
      image2: String,
      image3: String,
      image4: String,
      image5: String,
      youtubeVideoId: String,
      youtubeUrl: String,
      isInStock: Boolean,
      brand: String,
      model: String,
      discount: Number,
      lastManualUpdate: Date,
    },
    { timestamps: true, collection: 'stock' }
  )

  const categorySchema = new mongoose.Schema(
    {
      _id: { type: String },
      name: String,
      description: String,
      imageUrl: String,
    },
    { timestamps: true, collection: 'stockCategories' }
  )

  const Product = mongoose.models.Product || mongoose.model('Product', productSchema)
  const Category = mongoose.models.Category || mongoose.model('Category', categorySchema)
  // Usuarios
  const userSchema = new mongoose.Schema(
    {
      _id: { type: String },
      name: String,
      email: String,
      hashedPassword: String,
      role: String,
      active: Boolean,
    },
    { timestamps: true, collection: 'users' }
  )
  const User = mongoose.models.User || mongoose.model('User', userSchema)

  // Favoritos
  const favoriteSchema = new mongoose.Schema(
    {
      _id: { type: String },
      userId: String,
      productId: String,
      createdAt: Date,
    },
    { collection: 'favorites' }
  )
  const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema)

  // Proveedores
  const supplierSchema = new mongoose.Schema(
    {
      _id: { type: String },
      name: String,
      contactName: String,
      email: String,
      phone: String,
      address: String,
      category: String,
      notes: String,
      active: Boolean,
    },
    { timestamps: true, collection: 'suppliers' }
  )
  const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema)

  // Movimientos
  const movementSchema = new mongoose.Schema(
    {
      _id: { type: String },
      type: String,
      date: Date,
      supplierId: String,
      supplierName: String,
      items: Array,
      totalAmount: Number,
      currency: String,
      notes: String,
      attachments: Array,
      createdBy: String,
    },
    { timestamps: true, collection: 'movements' }
  )
  const Movement = mongoose.models.Movement || mongoose.model('Movement', movementSchema)

  // Servicios técnicos
  const techServiceSchema = new mongoose.Schema(
    {
      _id: { type: String },
      name: String,
      description: String,
      estimatedTime: Number,
      basePrice: Number,
      category: String,
      brandId: String,
      modelId: String,
      isActive: Boolean,
      lastManualUpdate: Date,
    },
    { timestamps: true, collection: 'technicalServices' }
  )
  const TechnicalService = mongoose.models.TechnicalService || mongoose.model('TechnicalService', techServiceSchema)

  // Transacciones y cierres
  const transactionSchema = new mongoose.Schema(
    {
      _id: { type: String },
      closingId: String,
      time: String,
      type: String,
      amount: Number,
      currency: String,
      description: String,
      user: String,
      reference: String,
      category: String,
      receivable: Number,
      isDebt: Boolean,
      exchangeRate: Number,
    },
    { timestamps: true, collection: 'transactions' }
  )
  const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema)

  const cashClosingSchema = new mongoose.Schema(
    {
      _id: { type: String },
      date: String,
      user: String,
      status: String,
      difference: Number,
      notes: String,
      balance: Object,
    },
    { timestamps: true, collection: 'cashClosings' }
  )
  const CashClosing = mongoose.models.CashClosing || mongoose.model('CashClosing', cashClosingSchema)

  return { Product, Category, User, Favorite, Supplier, Movement, TechnicalService, Transaction, CashClosing }
}

async function connectMongo() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Missing MONGODB_URI in environment')
    process.exit(1)
  }
  await mongoose.connect(uri, { bufferCommands: false })
}

function initFirebase() {
  const firebaseConfig = {
    apiKey: 'AIzaSyDhkIfoobCjUqu6thb7AOQBTCSidII9aGU',
    authDomain: 'altatelefonia-1e51b.firebaseapp.com',
    projectId: 'altatelefonia-1e51b',
    storageBucket: 'altatelefonia-1e51b.appspot.com',
    messagingSenderId: '724944708673',
    appId: '1:724944708673:web:874804815a39987d5652c0',
    measurementId: 'G-V8DG4G138Z',
  }
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  return getFirestore(app)
}

async function migrateCategories(db, Category) {
  console.log('🔄 Migrando categorías...')
  const snap = await getDocs(query(collection(db, 'stockCategories'), orderBy('name')))
  const docs = snap.docs.map((doc) => {
    const d = doc.data()
    return {
      _id: doc.id,
      name: d.name || '',
      description: d.description || '',
      imageUrl: d.imageUrl || '',
      createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
    }
  })
  await Category.deleteMany({})
  if (docs.length) await Category.insertMany(docs, { ordered: false })
  console.log(`✅ Categorías migradas: ${docs.length}`)
}

async function migrateProducts(db, Product) {
  console.log('🔄 Migrando productos...')
  const snap = await getDocs(query(collection(db, 'stock'), orderBy('name')))
  const docs = snap.docs.map((doc) => {
    const d = doc.data()
    return {
      _id: doc.id,
      name: d.name || '',
      description: d.description || '',
      markdownDescription: d.markdownDescription || '',
      price: d.price || 0,
      cost: d.cost || 0,
      currency: d.currency || 'USD',
      quantity: d.quantity || 0,
      category: d.category || '',
      location: d.location || '',
      obs: d.obs || '',
      images: d.images || [],
      image1: d.image1 || '',
      image2: d.image2 || '',
      image3: d.image3 || '',
      image4: d.image4 || '',
      image5: d.image5 || '',
      youtubeVideoId: d.youtubeVideoId || '',
      youtubeUrl: d.youtubeUrl || '',
      isInStock: (d.quantity || 0) > 0,
      brand: d.brand || '',
      model: d.model || '',
      discount: d.discount || 0,
      lastManualUpdate: d.lastManualUpdate ? new Date(d.lastManualUpdate) : undefined,
      createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
      updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
    }
  })
  await Product.deleteMany({})
  if (docs.length) await Product.insertMany(docs, { ordered: false })
  console.log(`✅ Productos migrados: ${docs.length}`)
}

async function migrateUsers(db, User) {
  console.log('🔄 Migrando usuarios...')
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
  const docs = snap.docs.map((doc) => {
    const d = doc.data()
    return {
      _id: doc.id,
      name: d.name || '',
      email: d.email || '',
      hashedPassword: d.hashedPassword || '',
      role: d.role || 'user',
      active: d.active !== undefined ? d.active : true,
      createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date(),
      updatedAt: d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate() : new Date(d.updatedAt)) : new Date(),
    }
  })
  await User.deleteMany({})
  if (docs.length) await User.insertMany(docs, { ordered: false })
  console.log(`✅ Usuarios migrados: ${docs.length}`)
}

async function migrateFavorites(db, Favorite) {
  console.log('🔄 Migrando favoritos...')
  const snap = await getDocs(query(collection(db, 'favorites'), orderBy('createdAt', 'desc')))
  const docs = snap.docs.map((doc) => {
    const d = doc.data()
    return {
      _id: doc.id,
      userId: d.userId || '',
      productId: d.productId || '',
      createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date(),
    }
  })
  await Favorite.deleteMany({})
  if (docs.length) await Favorite.insertMany(docs, { ordered: false })
  console.log(`✅ Favoritos migrados: ${docs.length}`)
}

async function migrateSuppliers(db, Supplier) {
  console.log('🔄 Migrando proveedores...')
  const snap = await getDocs(query(collection(db, 'suppliers'), orderBy('name')))
  const docs = snap.docs.map((doc) => {
    const d = doc.data()
    return {
      _id: doc.id,
      name: d.name || '',
      contactName: d.contactName || '',
      email: d.email || '',
      phone: d.phone || '',
      address: d.address || '',
      category: d.category || 'otros',
      notes: d.notes || '',
      active: d.active !== undefined ? d.active : true,
      createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date(),
      updatedAt: d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate() : new Date(d.updatedAt)) : new Date(),
    }
  })
  await Supplier.deleteMany({})
  if (docs.length) await Supplier.insertMany(docs, { ordered: false })
  console.log(`✅ Proveedores migrados: ${docs.length}`)
}

async function migrateMovements(db, Movement) {
  console.log('🔄 Migrando movimientos...')
  const snap = await getDocs(query(collection(db, 'movements'), orderBy('date', 'desc')))
  const docs = snap.docs.map((doc) => {
    const d = doc.data()
    return {
      _id: doc.id,
      type: d.type || 'purchase',
      date: d.date ? (d.date.toDate ? d.date.toDate() : new Date(d.date)) : new Date(),
      supplierId: d.supplierId || '',
      supplierName: d.supplierName || '',
      items: d.items || [],
      totalAmount: d.totalAmount || 0,
      currency: d.currency || 'USD',
      notes: d.notes || '',
      attachments: d.attachments || [],
      createdBy: d.createdBy || '',
      createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date(),
      updatedAt: d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate() : new Date(d.updatedAt)) : new Date(),
    }
  })
  await Movement.deleteMany({})
  if (docs.length) await Movement.insertMany(docs, { ordered: false })
  console.log(`✅ Movimientos migrados: ${docs.length}`)
}

async function migrateTechnicalServices(db, TechnicalService) {
  console.log('🔄 Migrando servicios técnicos...')
  const snap = await getDocs(query(collection(db, 'technicalServices'), orderBy('name')))
  const docs = snap.docs.map((doc) => {
    const d = doc.data()
    return {
      _id: doc.id,
      name: d.name || '',
      description: d.description || '',
      estimatedTime: d.estimatedTime || 0,
      basePrice: d.basePrice || 0,
      category: d.category || '',
      brandId: d.brandId || '',
      modelId: d.modelId || '',
      isActive: d.isActive !== undefined ? d.isActive : true,
      lastManualUpdate: d.lastManualUpdate ? new Date(d.lastManualUpdate) : undefined,
      createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date(),
      updatedAt: d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate() : new Date(d.updatedAt)) : new Date(),
    }
  })
  await TechnicalService.deleteMany({})
  if (docs.length) await TechnicalService.insertMany(docs, { ordered: false })
  console.log(`✅ Servicios técnicos migrados: ${docs.length}`)
}

async function migrateTransactions(db, Transaction) {
  console.log('🔄 Migrando transacciones...')
  const snap = await getDocs(query(collection(db, 'transactions'), orderBy('time', 'desc')))
  const docs = snap.docs.map((doc) => {
    const d = doc.data()
    return {
      _id: doc.id,
      closingId: d.closingId || '',
      time: d.time || new Date().toISOString(),
      type: d.type || 'Ingreso',
      amount: d.amount || 0,
      currency: d.currency || 'PESO',
      description: d.description || '',
      user: d.user || '',
      reference: d.reference || '',
      category: d.category || '',
      receivable: d.receivable || 0,
      isDebt: d.isDebt || false,
      exchangeRate: d.exchangeRate || undefined,
      createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date(),
      updatedAt: d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate() : new Date(d.updatedAt)) : new Date(),
    }
  })
  await Transaction.deleteMany({})
  if (docs.length) await Transaction.insertMany(docs, { ordered: false })
  console.log(`✅ Transacciones migradas: ${docs.length}`)
}

async function migrateCashClosings(db, CashClosing) {
  console.log('🔄 Migrando cierres de caja...')
  const snap = await getDocs(query(collection(db, 'cashClosings'), orderBy('date', 'desc')))
  const docs = snap.docs.map((doc) => {
    const d = doc.data()
    return {
      _id: doc.id,
      date: d.date || new Date().toISOString(),
      user: d.user || '',
      status: d.status || 'Correcto',
      difference: d.difference || 0,
      notes: d.notes || '',
      balance: d.balance || {},
      createdAt: d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)) : new Date(),
      updatedAt: d.updatedAt ? (d.updatedAt.toDate ? d.updatedAt.toDate() : new Date(d.updatedAt)) : new Date(),
    }
  })
  await CashClosing.deleteMany({})
  if (docs.length) await CashClosing.insertMany(docs, { ordered: false })
  console.log(`✅ Cierres de caja migrados: ${docs.length}`)
}

async function main() {
  try {
    await connectMongo()
    const { Product, Category, User, Favorite, Supplier, Movement, TechnicalService, Transaction, CashClosing } = registerModels(mongoose)
    const db = initFirebase()
    await migrateUsers(db, User)
    await migrateCategories(db, Category)
    await migrateProducts(db, Product)
    await migrateSuppliers(db, Supplier)
    await migrateMovements(db, Movement)
    await migrateFavorites(db, Favorite)
    await migrateTechnicalServices(db, TechnicalService)
    await migrateTransactions(db, Transaction)
    await migrateCashClosings(db, CashClosing)
    console.log('🎉 Migración JS completada')
  } catch (e) {
    console.error('❌ Error en migración JS:', e)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

main()


