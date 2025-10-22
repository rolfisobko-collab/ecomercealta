#!/usr/bin/env node

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkDatabase() {
  console.log('🔍 Verificando base de datos...');
  console.log(`📡 URI: ${MONGODB_URI.replace(/:[^:@]+@/, ':***@')}`);
  
  try {
    // Conectar sin especificar base de datos
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Conectado a MongoDB Atlas');
    
    // Listar todas las bases de datos
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('\n📊 Bases de datos disponibles:');
    dbs.databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Verificar la base de datos actual
    const currentDb = mongoose.connection.db.databaseName;
    console.log(`\n🎯 Base de datos actual: ${currentDb}`);
    
    // Listar colecciones en la base de datos actual
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📋 Colecciones en ${currentDb}:`);
    if (collections.length > 0) {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log('   (No hay colecciones)');
    }
    
    // Verificar si existe la base de datos mobile-repair-ecommerce
    const targetDb = 'mobile-repair-ecommerce';
    const targetDbExists = dbs.databases.some(db => db.name === targetDb);
    
    if (targetDbExists) {
      console.log(`\n✅ La base de datos ${targetDb} existe`);
      
      // Conectar a la base de datos específica
      await mongoose.disconnect();
      const specificUri = MONGODB_URI.replace('?retryWrites=true&w=majority&appName=Cluster0', `/${targetDb}?retryWrites=true&w=majority&appName=Cluster0`);
      await mongoose.connect(specificUri);
      
      console.log(`✅ Conectado a ${targetDb}`);
      
      // Listar colecciones en la base de datos específica
      const specificCollections = await mongoose.connection.db.listCollections().toArray();
      console.log(`\n📋 Colecciones en ${targetDb}:`);
      if (specificCollections.length > 0) {
        specificCollections.forEach(col => {
          console.log(`   - ${col.name}`);
        });
        
        // Contar documentos en cada colección
        console.log('\n📊 Conteo de documentos:');
        for (const col of specificCollections) {
          const count = await mongoose.connection.db.collection(col.name).countDocuments();
          console.log(`   - ${col.name}: ${count} documentos`);
        }
      } else {
        console.log('   (No hay colecciones)');
      }
      
    } else {
      console.log(`\n⚠️ La base de datos ${targetDb} no existe`);
      console.log('🔧 Creando base de datos...');
      
      // Crear la base de datos
      await mongoose.disconnect();
      const specificUri = MONGODB_URI.replace('?retryWrites=true&w=majority&appName=Cluster0', `/${targetDb}?retryWrites=true&w=majority&appName=Cluster0`);
      await mongoose.connect(specificUri);
      
      console.log(`✅ Base de datos ${targetDb} creada`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB Atlas');
  }
}

// Ejecutar verificación
checkDatabase();





