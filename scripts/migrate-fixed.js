#!/usr/bin/env node

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, getDocs, query, orderBy } = require("firebase/firestore");
const mongoose = require("mongoose");

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDhkIfoobCjUqu6thb7AOQBTCSidII9aGU",
  authDomain: "altatelefonia-1e51b.firebaseapp.com",
  projectId: "altatelefonia-1e51b",
  storageBucket: "altatelefonia-1e51b.appspot.com",
  messagingSenderId: "724944708673",
  appId: "1:724944708673:web:874804815a39987d5652c0",
  measurementId: "G-V8DG4G138Z",
};

// Configuración de MongoDB - usar la misma lógica que el script de prueba
const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

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

async function connectToMongoDB() {
  try {
    console.log('🔌 Conectando a MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Conectado a MongoDB Atlas");
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    throw error;
  }
}

async function migrateUsers() {
  console.log("🔄 Migrando usuarios...");
  try {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(query(usersRef, orderBy("createdAt", "desc")));
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        name: data.name || "",
        email: data.email || "",
        hashedPassword: data.hashedPassword || "",
        role: data.role || "user",
        active: data.active !== undefined ? data.active : true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    if (users.length > 0) {
      await User.deleteMany({});
      await User.insertMany(users, { ordered: false });
      console.log(`✅ Migrados ${users.length} usuarios`);
    } else {
      console.log("ℹ️ No hay usuarios para migrar");
    }
  } catch (error) {
    console.error("❌ Error migrando usuarios:", error);
  }
}

async function migrateProducts() {
  console.log("🔄 Migrando productos...");
  try {
    const productsRef = collection(db, "stock");
    const querySnapshot = await getDocs(query(productsRef, orderBy("name")));
    
    const products = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        name: data.name || "",
        description: data.description || "",
        markdownDescription: data.markdownDescription || "",
        price: data.price || 0,
        cost: data.cost || 0,
        currency: data.currency || "USD",
        quantity: data.quantity || 0,
        category: data.category || "",
        location: data.location || "",
        obs: data.obs || "",
        images: data.images || [],
        image1: data.image1 || "",
        image2: data.image2 || "",
        image3: data.image3 || "",
        image4: data.image4 || "",
        image5: data.image5 || "",
        youtubeVideoId: data.youtubeVideoId || "",
        youtubeUrl: data.youtubeUrl || "",
        isInStock: data.quantity > 0,
        brand: data.brand || "",
        model: data.model || "",
        discount: data.discount || 0,
        lastManualUpdate: data.lastManualUpdate ? new Date(data.lastManualUpdate) : undefined,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      };
    });

    if (products.length > 0) {
      await Product.deleteMany({});
      await Product.insertMany(products, { ordered: false });
      console.log(`✅ Migrados ${products.length} productos`);
    } else {
      console.log("ℹ️ No hay productos para migrar");
    }
  } catch (error) {
    console.error("❌ Error migrando productos:", error);
  }
}

async function migrateCategories() {
  console.log("🔄 Migrando categorías...");
  try {
    const categoriesRef = collection(db, "stockCategories");
    const querySnapshot = await getDocs(query(categoriesRef, orderBy("name")));
    
    const categories = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        name: data.name || "",
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      };
    });

    if (categories.length > 0) {
      await Category.deleteMany({});
      await Category.insertMany(categories, { ordered: false });
      console.log(`✅ Migradas ${categories.length} categorías`);
    } else {
      console.log("ℹ️ No hay categorías para migrar");
    }
  } catch (error) {
    console.error("❌ Error migrando categorías:", error);
  }
}

async function migrateSuppliers() {
  console.log("🔄 Migrando proveedores...");
  try {
    const suppliersRef = collection(db, "suppliers");
    const querySnapshot = await getDocs(query(suppliersRef, orderBy("name")));
    
    const suppliers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        name: data.name || "",
        contactName: data.contactName || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        category: data.category || "otros",
        notes: data.notes || "",
        active: data.active !== undefined ? data.active : true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    if (suppliers.length > 0) {
      await Supplier.deleteMany({});
      await Supplier.insertMany(suppliers, { ordered: false });
      console.log(`✅ Migrados ${suppliers.length} proveedores`);
    } else {
      console.log("ℹ️ No hay proveedores para migrar");
    }
  } catch (error) {
    console.error("❌ Error migrando proveedores:", error);
  }
}

async function migrateMovements() {
  console.log("🔄 Migrando movimientos...");
  try {
    const movementsRef = collection(db, "movements");
    const querySnapshot = await getDocs(query(movementsRef, orderBy("date", "desc")));
    
    const movements = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        type: data.type || "purchase",
        date: data.date?.toDate() || new Date(),
        supplierId: data.supplierId || "",
        supplierName: data.supplierName || "",
        items: data.items || [],
        totalAmount: data.totalAmount || 0,
        currency: data.currency || "USD",
        notes: data.notes || "",
        attachments: data.attachments || [],
        createdBy: data.createdBy || "",
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    if (movements.length > 0) {
      await Movement.deleteMany({});
      await Movement.insertMany(movements, { ordered: false });
      console.log(`✅ Migrados ${movements.length} movimientos`);
    } else {
      console.log("ℹ️ No hay movimientos para migrar");
    }
  } catch (error) {
    console.error("❌ Error migrando movimientos:", error);
  }
}

async function migrateFavorites() {
  console.log("🔄 Migrando favoritos...");
  try {
    const favoritesRef = collection(db, "favorites");
    const querySnapshot = await getDocs(query(favoritesRef, orderBy("createdAt", "desc")));
    
    const favorites = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        userId: data.userId || "",
        productId: data.productId || "",
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });

    if (favorites.length > 0) {
      await Favorite.deleteMany({});
      await Favorite.insertMany(favorites, { ordered: false });
      console.log(`✅ Migrados ${favorites.length} favoritos`);
    } else {
      console.log("ℹ️ No hay favoritos para migrar");
    }
  } catch (error) {
    console.error("❌ Error migrando favoritos:", error);
  }
}

async function migrateTechnicalServices() {
  console.log("🔄 Migrando servicios técnicos...");
  try {
    const servicesRef = collection(db, "technicalServices");
    const querySnapshot = await getDocs(query(servicesRef, orderBy("name")));
    
    const services = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        name: data.name || "",
        description: data.description || "",
        estimatedTime: data.estimatedTime || 0,
        basePrice: data.basePrice || 0,
        category: data.category || "",
        brandId: data.brandId || "",
        modelId: data.modelId || "",
        isActive: data.isActive !== undefined ? data.isActive : true,
        lastManualUpdate: data.lastManualUpdate ? new Date(data.lastManualUpdate) : undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    if (services.length > 0) {
      await TechnicalService.deleteMany({});
      await TechnicalService.insertMany(services, { ordered: false });
      console.log(`✅ Migrados ${services.length} servicios técnicos`);
    } else {
      console.log("ℹ️ No hay servicios técnicos para migrar");
    }
  } catch (error) {
    console.error("❌ Error migrando servicios técnicos:", error);
  }
}

async function migrateTransactions() {
  console.log("🔄 Migrando transacciones...");
  try {
    const transactionsRef = collection(db, "transactions");
    const querySnapshot = await getDocs(query(transactionsRef, orderBy("time", "desc")));
    
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        closingId: data.closingId || "",
        time: data.time || new Date().toISOString(),
        type: data.type || "Ingreso",
        amount: data.amount || 0,
        currency: data.currency || "PESO",
        description: data.description || "",
        user: data.user || "",
        reference: data.reference || "",
        category: data.category || "",
        receivable: data.receivable || 0,
        isDebt: data.isDebt || false,
        exchangeRate: data.exchangeRate || undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    if (transactions.length > 0) {
      await Transaction.deleteMany({});
      await Transaction.insertMany(transactions, { ordered: false });
      console.log(`✅ Migradas ${transactions.length} transacciones`);
    } else {
      console.log("ℹ️ No hay transacciones para migrar");
    }
  } catch (error) {
    console.error("❌ Error migrando transacciones:", error);
  }
}

async function migrateCashClosings() {
  console.log("🔄 Migrando cierres de caja...");
  try {
    const closingsRef = collection(db, "cashClosings");
    const querySnapshot = await getDocs(query(closingsRef, orderBy("date", "desc")));
    
    const closings = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        date: data.date || new Date().toISOString(),
        user: data.user || "",
        status: data.status || "Correcto",
        difference: data.difference || 0,
        notes: data.notes || "",
        balance: data.balance || {
          USD: { income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 },
          USDT: { income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 },
          PESO: { income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 },
          PESO_TRANSFERENCIA: { income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 },
          REAL: { income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 },
          GUARANI: { income: 0, expense: 0, receivable: 0, balance: 0 },
          date: new Date().toISOString(),
        },
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    if (closings.length > 0) {
      await CashClosing.deleteMany({});
      await CashClosing.insertMany(closings, { ordered: false });
      console.log(`✅ Migrados ${closings.length} cierres de caja`);
    } else {
      console.log("ℹ️ No hay cierres de caja para migrar");
    }
  } catch (error) {
    console.error("❌ Error migrando cierres de caja:", error);
  }
}

async function main() {
  console.log("🚀 Iniciando migración de Firebase a MongoDB...");
  
  try {
    // Conectar a MongoDB
    await connectToMongoDB();
    
    // Migrar datos
    await migrateUsers();
    await migrateCategories();
    await migrateProducts();
    await migrateSuppliers();
    await migrateMovements();
    await migrateFavorites();
    await migrateTechnicalServices();
    await migrateTransactions();
    await migrateCashClosings();
    
    console.log("🎉 ¡Migración completada exitosamente!");
    
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Ejecutar migración
main();





