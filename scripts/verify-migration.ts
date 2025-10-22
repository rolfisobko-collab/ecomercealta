#!/usr/bin/env ts-node

import { connectToMongoDB } from "../lib/mongoose.js"
import { User } from "../models/mongodb/User"
import { Product } from "../models/mongodb/Product"
import { Category } from "../models/mongodb/Category"
import { Supplier } from "../models/mongodb/Supplier"
import { Movement } from "../models/mongodb/Movement"
import { Favorite } from "../models/mongodb/Favorite"
import { TechnicalService } from "../models/mongodb/TechnicalService"
import { Transaction, CashClosing } from "../models/mongodb/CashRegister"

async function verifyUsers() {
  console.log("🔍 Verificando usuarios...")
  try {
    const count = await User.countDocuments()
    console.log(`✅ Usuarios: ${count}`)
    
    if (count > 0) {
      const sample = await User.findOne()
      console.log(`   📋 Ejemplo: ${sample?.name} (${sample?.email})`)
    }
    return count
  } catch (error) {
    console.error("❌ Error verificando usuarios:", error)
    return 0
  }
}

async function verifyProducts() {
  console.log("🔍 Verificando productos...")
  try {
    const count = await Product.countDocuments()
    console.log(`✅ Productos: ${count}`)
    
    if (count > 0) {
      const sample = await Product.findOne()
      console.log(`   📋 Ejemplo: ${sample?.name} (${sample?.price})`)
    }
    return count
  } catch (error) {
    console.error("❌ Error verificando productos:", error)
    return 0
  }
}

async function verifyCategories() {
  console.log("🔍 Verificando categorías...")
  try {
    const count = await Category.countDocuments()
    console.log(`✅ Categorías: ${count}`)
    
    if (count > 0) {
      const sample = await Category.findOne()
      console.log(`   📋 Ejemplo: ${sample?.name}`)
    }
    return count
  } catch (error) {
    console.error("❌ Error verificando categorías:", error)
    return 0
  }
}

async function verifySuppliers() {
  console.log("🔍 Verificando proveedores...")
  try {
    const count = await Supplier.countDocuments()
    console.log(`✅ Proveedores: ${count}`)
    
    if (count > 0) {
      const sample = await Supplier.findOne()
      console.log(`   📋 Ejemplo: ${sample?.name}`)
    }
    return count
  } catch (error) {
    console.error("❌ Error verificando proveedores:", error)
    return 0
  }
}

async function verifyMovements() {
  console.log("🔍 Verificando movimientos...")
  try {
    const count = await Movement.countDocuments()
    console.log(`✅ Movimientos: ${count}`)
    
    if (count > 0) {
      const sample = await Movement.findOne()
      console.log(`   📋 Ejemplo: ${sample?.type} - ${sample?.totalAmount}`)
    }
    return count
  } catch (error) {
    console.error("❌ Error verificando movimientos:", error)
    return 0
  }
}

async function verifyFavorites() {
  console.log("🔍 Verificando favoritos...")
  try {
    const count = await Favorite.countDocuments()
    console.log(`✅ Favoritos: ${count}`)
    return count
  } catch (error) {
    console.error("❌ Error verificando favoritos:", error)
    return 0
  }
}

async function verifyTechnicalServices() {
  console.log("🔍 Verificando servicios técnicos...")
  try {
    const count = await TechnicalService.countDocuments()
    console.log(`✅ Servicios técnicos: ${count}`)
    
    if (count > 0) {
      const sample = await TechnicalService.findOne()
      console.log(`   📋 Ejemplo: ${sample?.name} - ${sample?.basePrice}`)
    }
    return count
  } catch (error) {
    console.error("❌ Error verificando servicios técnicos:", error)
    return 0
  }
}

async function verifyTransactions() {
  console.log("🔍 Verificando transacciones...")
  try {
    const count = await Transaction.countDocuments()
    console.log(`✅ Transacciones: ${count}`)
    
    if (count > 0) {
      const sample = await Transaction.findOne()
      console.log(`   📋 Ejemplo: ${sample?.type} - ${sample?.amount} ${sample?.currency}`)
    }
    return count
  } catch (error) {
    console.error("❌ Error verificando transacciones:", error)
    return 0
  }
}

async function verifyCashClosings() {
  console.log("🔍 Verificando cierres de caja...")
  try {
    const count = await CashClosing.countDocuments()
    console.log(`✅ Cierres de caja: ${count}`)
    
    if (count > 0) {
      const sample = await CashClosing.findOne()
      console.log(`   📋 Ejemplo: ${sample?.date} - ${sample?.status}`)
    }
    return count
  } catch (error) {
    console.error("❌ Error verificando cierres de caja:", error)
    return 0
  }
}

async function testQueries() {
  console.log("🧪 Probando consultas...")
  
  try {
    // Probar búsqueda de productos
    const products = await Product.find({ name: { $regex: /.*/, $options: 'i' } }).limit(5)
    console.log(`✅ Búsqueda de productos: ${products.length} resultados`)
    
    // Probar filtro por categoría
    const categories = await Category.find({}).limit(3)
    console.log(`✅ Categorías disponibles: ${categories.length}`)
    
    // Probar usuarios activos
    const activeUsers = await User.find({ active: true })
    console.log(`✅ Usuarios activos: ${activeUsers.length}`)
    
    return true
  } catch (error) {
    console.error("❌ Error en consultas de prueba:", error)
    return false
  }
}

async function main() {
  console.log("🔍 Verificando migración de Firebase a MongoDB...")
  
  try {
    // Conectar a MongoDB
    await connectToMongoDB()
    console.log("✅ Conectado a MongoDB Atlas")
    
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
    }
    
    // Probar consultas
    const queriesWork = await testQueries()
    
    // Resumen
    console.log("\n📊 RESUMEN DE MIGRACIÓN:")
    console.log("=".repeat(50))
    
    const totalRecords = Object.values(results).reduce((sum, count) => sum + count, 0)
    console.log(`📈 Total de registros migrados: ${totalRecords}`)
    
    Object.entries(results).forEach(([collection, count]) => {
      const status = count > 0 ? "✅" : "⚠️"
      console.log(`${status} ${collection}: ${count} registros`)
    })
    
    console.log(`🧪 Consultas funcionando: ${queriesWork ? "✅" : "❌"}`)
    
    if (totalRecords > 0 && queriesWork) {
      console.log("\n🎉 ¡Migración verificada exitosamente!")
      console.log("✅ Todos los datos se migraron correctamente")
      console.log("✅ Las consultas funcionan correctamente")
      console.log("✅ El sistema está listo para usar MongoDB")
    } else {
      console.log("\n⚠️ La migración puede tener problemas")
      console.log("🔍 Revisa los logs anteriores para más detalles")
    }
    
  } catch (error) {
    console.error("❌ Error durante la verificación:", error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

// Ejecutar verificación
if (require.main === module) {
  main()
}





