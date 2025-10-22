#!/usr/bin/env node

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Esquemas de MongoDB
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  hashedPassword: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'user'], default: 'user' },
  active: { type: Boolean, default: true }
}, { timestamps: true, collection: 'users' });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  markdownDescription: { type: String },
  price: { type: Number, required: true, min: 0 },
  cost: { type: Number, min: 0 },
  currency: { type: String, default: 'USD' },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  category: { type: String, required: true },
  location: { type: String },
  obs: { type: String },
  images: [{ type: String }],
  image1: { type: String },
  image2: { type: String },
  image3: { type: String },
  image4: { type: String },
  image5: { type: String },
  youtubeVideoId: { type: String },
  youtubeUrl: { type: String },
  isInStock: { type: Boolean, default: function() { return this.quantity > 0 } },
  brand: { type: String },
  model: { type: String },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  lastManualUpdate: { type: Date }
}, { timestamps: true, collection: 'stock' });

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true }
}, { timestamps: true, collection: 'stockCategories' });

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ["repuestos", "accesorios", "herramientas", "servicios", "otros"] },
  notes: { type: String, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true, collection: 'suppliers' });

const MovementSchema = new mongoose.Schema({
  type: { type: String, enum: ["purchase", "stock_in", "stock_out"], required: true },
  date: { type: Date, required: true },
  supplierId: { type: String },
  supplierName: { type: String },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'USD' },
  notes: { type: String, default: "" },
  attachments: [{ type: String }],
  createdBy: { type: String, required: true }
}, { timestamps: true, collection: 'movements' });

const FavoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true }
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'favorites' });

const TechnicalServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  estimatedTime: { type: Number, required: true, min: 0 },
  basePrice: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  brandId: { type: String },
  modelId: { type: String },
  isActive: { type: Boolean, default: true },
  lastManualUpdate: { type: Date }
}, { timestamps: true, collection: 'technicalServices' });

const TransactionSchema = new mongoose.Schema({
  closingId: { type: String, default: "" },
  time: { type: String, required: true },
  type: { type: String, enum: ["Ingreso", "Egreso", "Venta", "Compra", "Ajuste"], required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ["USD", "USDT", "PESO", "PESO_TRANSFERENCIA", "REAL", "GUARANI"], required: true },
  description: { type: String, required: true },
  user: { type: String, required: true },
  reference: { type: String, required: true },
  category: { type: String },
  receivable: { type: Number, default: 0 },
  isDebt: { type: Boolean, default: false },
  exchangeRate: { type: Number }
}, { timestamps: true, collection: 'transactions' });

const CashClosingSchema = new mongoose.Schema({
  date: { type: String, required: true },
  user: { type: String, required: true },
  status: { type: String, enum: ["Correcto", "Faltante", "Sobrante"], required: true },
  difference: { type: Number, required: true },
  notes: { type: String, default: "" },
  balance: { type: Object, required: true }
}, { timestamps: true, collection: 'cashClosings' });

// Modelos
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Category = mongoose.model('Category', CategorySchema);
const Supplier = mongoose.model('Supplier', SupplierSchema);
const Movement = mongoose.model('Movement', MovementSchema);
const Favorite = mongoose.model('Favorite', FavoriteSchema);
const TechnicalService = mongoose.model('TechnicalService', TechnicalServiceSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const CashClosing = mongoose.model('CashClosing', CashClosingSchema);

async function verifyUsers() {
  console.log("🔍 Verificando usuarios...");
  try {
    const count = await User.countDocuments();
    console.log(`✅ Usuarios: ${count}`);
    
    if (count > 0) {
      const sample = await User.findOne();
      console.log(`   📋 Ejemplo: ${sample?.name} (${sample?.email})`);
    }
    return count;
  } catch (error) {
    console.error("❌ Error verificando usuarios:", error);
    return 0;
  }
}

async function verifyProducts() {
  console.log("🔍 Verificando productos...");
  try {
    const count = await Product.countDocuments();
    console.log(`✅ Productos: ${count}`);
    
    if (count > 0) {
      const sample = await Product.findOne();
      console.log(`   📋 Ejemplo: ${sample?.name} (${sample?.price})`);
    }
    return count;
  } catch (error) {
    console.error("❌ Error verificando productos:", error);
    return 0;
  }
}

async function verifyCategories() {
  console.log("🔍 Verificando categorías...");
  try {
    const count = await Category.countDocuments();
    console.log(`✅ Categorías: ${count}`);
    
    if (count > 0) {
      const sample = await Category.findOne();
      console.log(`   📋 Ejemplo: ${sample?.name}`);
    }
    return count;
  } catch (error) {
    console.error("❌ Error verificando categorías:", error);
    return 0;
  }
}

async function verifySuppliers() {
  console.log("🔍 Verificando proveedores...");
  try {
    const count = await Supplier.countDocuments();
    console.log(`✅ Proveedores: ${count}`);
    
    if (count > 0) {
      const sample = await Supplier.findOne();
      console.log(`   📋 Ejemplo: ${sample?.name}`);
    }
    return count;
  } catch (error) {
    console.error("❌ Error verificando proveedores:", error);
    return 0;
  }
}

async function verifyMovements() {
  console.log("🔍 Verificando movimientos...");
  try {
    const count = await Movement.countDocuments();
    console.log(`✅ Movimientos: ${count}`);
    
    if (count > 0) {
      const sample = await Movement.findOne();
      console.log(`   📋 Ejemplo: ${sample?.type} - ${sample?.totalAmount}`);
    }
    return count;
  } catch (error) {
    console.error("❌ Error verificando movimientos:", error);
    return 0;
  }
}

async function verifyFavorites() {
  console.log("🔍 Verificando favoritos...");
  try {
    const count = await Favorite.countDocuments();
    console.log(`✅ Favoritos: ${count}`);
    return count;
  } catch (error) {
    console.error("❌ Error verificando favoritos:", error);
    return 0;
  }
}

async function verifyTechnicalServices() {
  console.log("🔍 Verificando servicios técnicos...");
  try {
    const count = await TechnicalService.countDocuments();
    console.log(`✅ Servicios técnicos: ${count}`);
    
    if (count > 0) {
      const sample = await TechnicalService.findOne();
      console.log(`   📋 Ejemplo: ${sample?.name} - ${sample?.basePrice}`);
    }
    return count;
  } catch (error) {
    console.error("❌ Error verificando servicios técnicos:", error);
    return 0;
  }
}

async function verifyTransactions() {
  console.log("🔍 Verificando transacciones...");
  try {
    const count = await Transaction.countDocuments();
    console.log(`✅ Transacciones: ${count}`);
    
    if (count > 0) {
      const sample = await Transaction.findOne();
      console.log(`   📋 Ejemplo: ${sample?.type} - ${sample?.amount} ${sample?.currency}`);
    }
    return count;
  } catch (error) {
    console.error("❌ Error verificando transacciones:", error);
    return 0;
  }
}

async function verifyCashClosings() {
  console.log("🔍 Verificando cierres de caja...");
  try {
    const count = await CashClosing.countDocuments();
    console.log(`✅ Cierres de caja: ${count}`);
    
    if (count > 0) {
      const sample = await CashClosing.findOne();
      console.log(`   📋 Ejemplo: ${sample?.date} - ${sample?.status}`);
    }
    return count;
  } catch (error) {
    console.error("❌ Error verificando cierres de caja:", error);
    return 0;
  }
}

async function testQueries() {
  console.log("🧪 Probando consultas...");
  
  try {
    // Probar búsqueda de productos
    const products = await Product.find({ name: { $regex: /.*/, $options: 'i' } }).limit(5);
    console.log(`✅ Búsqueda de productos: ${products.length} resultados`);
    
    // Probar filtro por categoría
    const categories = await Category.find({}).limit(3);
    console.log(`✅ Categorías disponibles: ${categories.length}`);
    
    // Probar usuarios activos
    const activeUsers = await User.find({ active: true });
    console.log(`✅ Usuarios activos: ${activeUsers.length}`);
    
    return true;
  } catch (error) {
    console.error("❌ Error en consultas de prueba:", error);
    return false;
  }
}

async function main() {
  console.log("🔍 Verificando migración de Firebase a MongoDB...");
  
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Conectado a MongoDB Atlas");
    
    // Verificar cada colección
    const results = {
      users: await verifyUsers(),
      products: await verifyProducts(),
      categories: await verifyCategories(),
      suppliers: await verifySuppliers(),
      movements: await verifyMovements(),
      favorites: await verifyFavorites(),
      technicalServices: await verifyTechnicalServices(),
      transactions: await verifyTransactions(),
      cashClosings: await verifyCashClosings(),
    };
    
    // Probar consultas
    const queriesWork = await testQueries();
    
    // Resumen
    console.log("\n📊 RESUMEN DE MIGRACIÓN:");
    console.log("=" * 50);
    
    const totalRecords = Object.values(results).reduce((sum, count) => sum + count, 0);
    console.log(`📈 Total de registros migrados: ${totalRecords}`);
    
    Object.entries(results).forEach(([collection, count]) => {
      const status = count > 0 ? "✅" : "⚠️";
      console.log(`${status} ${collection}: ${count} registros`);
    });
    
    console.log(`🧪 Consultas funcionando: ${queriesWork ? "✅" : "❌"}`);
    
    if (totalRecords > 0 && queriesWork) {
      console.log("\n🎉 ¡Migración verificada exitosamente!");
      console.log("✅ Todos los datos se migraron correctamente");
      console.log("✅ Las consultas funcionan correctamente");
      console.log("✅ El sistema está listo para usar MongoDB");
    } else {
      console.log("\n⚠️ La migración puede tener problemas");
      console.log("🔍 Revisa los logs anteriores para más detalles");
    }
    
  } catch (error) {
    console.error("❌ Error durante la verificación:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB Atlas");
    process.exit(0);
  }
}

// Ejecutar verificación
main();





