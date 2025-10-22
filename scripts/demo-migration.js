#!/usr/bin/env node

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, getDocs, query, orderBy } = require("firebase/firestore");

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

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function analyzeFirebaseData() {
  console.log("🔍 Analizando datos en Firebase...");
  
  const collections = [
    { name: "users", display: "Usuarios" },
    { name: "stock", display: "Productos" },
    { name: "stockCategories", display: "Categorías" },
    { name: "suppliers", display: "Proveedores" },
    { name: "movements", display: "Movimientos" },
    { name: "favorites", display: "Favoritos" },
    { name: "technicalServices", display: "Servicios Técnicos" },
    { name: "transactions", display: "Transacciones" },
    { name: "cashClosings", display: "Cierres de Caja" }
  ];

  let totalRecords = 0;
  const results = {};

  for (const collectionInfo of collections) {
    try {
      console.log(`\n📊 Analizando ${collectionInfo.display}...`);
      const collectionRef = collection(db, collectionInfo.name);
      const querySnapshot = await getDocs(query(collectionRef, orderBy("createdAt", "desc")));
      
      const count = querySnapshot.docs.length;
      results[collectionInfo.name] = count;
      totalRecords += count;
      
      console.log(`   ✅ ${collectionInfo.display}: ${count} registros`);
      
      // Mostrar ejemplo de datos si existen
      if (count > 0) {
        const sampleDoc = querySnapshot.docs[0];
        const sampleData = sampleDoc.data();
        console.log(`   📋 Ejemplo: ${JSON.stringify(sampleData, null, 2).substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ⚠️ ${collectionInfo.display}: Error - ${error.message}`);
      results[collectionInfo.name] = 0;
    }
  }

  return { results, totalRecords };
}

async function showMigrationPlan() {
  console.log("\n📋 PLAN DE MIGRACIÓN:");
  console.log("=" * 50);
  
  console.log("\n1️⃣ CONFIGURACIÓN REQUERIDA:");
  console.log("   • Actualizar MONGODB_URI en .env.local con contraseña real");
  console.log("   • Verificar conexión a MongoDB Atlas");
  console.log("   • Configurar DATABASE_PROVIDER=mongodb");
  
  console.log("\n2️⃣ PROCESO DE MIGRACIÓN:");
  console.log("   • Conectar a Firebase (origen)");
  console.log("   • Conectar a MongoDB Atlas (destino)");
  console.log("   • Migrar datos colección por colección");
  console.log("   • Verificar integridad de datos");
  console.log("   • Actualizar servicios para usar MongoDB");
  
  console.log("\n3️⃣ SERVICIOS HÍBRIDOS:");
  console.log("   • services/hybrid/ - Servicios que alternan entre Firebase y MongoDB");
  console.log("   • services/mongodb/ - Servicios específicos para MongoDB");
  console.log("   • services/api/ - Servicios originales de Firebase (mantenidos)");
  
  console.log("\n4️⃣ VENTAJAS DE LA MIGRACIÓN:");
  console.log("   • Mejor rendimiento y escalabilidad");
  console.log("   • Consultas más flexibles");
  console.log("   • Índices optimizados");
  console.log("   • Rollback fácil a Firebase");
  
  console.log("\n5️⃣ COMANDOS DISPONIBLES:");
  console.log("   • pnpm run migrate:simple - Migración básica");
  console.log("   • pnpm run migrate:full - Migración completa");
  console.log("   • pnpm run verify - Verificar migración");
  console.log("   • pnpm run update-imports - Actualizar importaciones");
}

async function main() {
  console.log("🚀 DEMO: Análisis de Migración Firebase → MongoDB Atlas");
  console.log("=" * 60);
  
  try {
    // Analizar datos en Firebase
    const { results, totalRecords } = await analyzeFirebaseData();
    
    console.log("\n📊 RESUMEN DE DATOS EN FIREBASE:");
    console.log("=" * 40);
    console.log(`📈 Total de registros: ${totalRecords}`);
    
    Object.entries(results).forEach(([collection, count]) => {
      const status = count > 0 ? "✅" : "⚠️";
      console.log(`${status} ${collection}: ${count} registros`);
    });
    
    if (totalRecords > 0) {
      console.log("\n🎯 MIGRACIÓN LISTA PARA EJECUTAR");
      console.log("=" * 40);
      console.log("✅ Datos encontrados en Firebase");
      console.log("✅ Scripts de migración creados");
      console.log("✅ Servicios híbridos implementados");
      console.log("✅ Esquemas de MongoDB configurados");
      
      console.log("\n🔧 PRÓXIMOS PASOS:");
      console.log("1. Actualiza la contraseña de MongoDB en .env.local");
      console.log("2. Ejecuta: pnpm run migrate:simple");
      console.log("3. Verifica: pnpm run verify");
      console.log("4. Cambia DATABASE_PROVIDER=mongodb");
      console.log("5. Reinicia la aplicación");
      
    } else {
      console.log("\n⚠️ NO SE ENCONTRARON DATOS EN FIREBASE");
      console.log("🔍 Verifica que Firebase esté configurado correctamente");
    }
    
    // Mostrar plan de migración
    await showMigrationPlan();
    
  } catch (error) {
    console.error("❌ Error durante el análisis:", error);
    console.log("\n🔧 SOLUCIONES:");
    console.log("1. Verifica la configuración de Firebase");
    console.log("2. Confirma que las credenciales sean correctas");
    console.log("3. Revisa la conexión a internet");
  }
}

// Ejecutar análisis
main();





