#!/usr/bin/env node

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function moveDataToCorrectDatabase() {
  console.log('🔄 Moviendo datos a la base de datos correcta...');
  
  try {
    // Conectar a la base de datos test (donde están los datos)
    const testUri = MONGODB_URI.replace('?retryWrites=true&w=majority&appName=Cluster0', '/test?retryWrites=true&w=majority&appName=Cluster0');
    await mongoose.connect(testUri);
    console.log('✅ Conectado a la base de datos test');
    
    // Obtener todas las colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Encontradas ${collections.length} colecciones en test`);
    
    // Conectar a la base de datos correcta
    await mongoose.disconnect();
    const correctUri = MONGODB_URI.replace('?retryWrites=true&w=majority&appName=Cluster0', '/mobile-repair-ecommerce?retryWrites=true&w=majority&appName=Cluster0');
    await mongoose.connect(correctUri);
    console.log('✅ Conectado a la base de datos mobile-repair-ecommerce');
    
    // Reconectar a test para copiar datos
    const testConnection = await mongoose.createConnection(testUri);
    
    let totalMoved = 0;
    
    for (const collection of collections) {
      if (collection.name === 'test_connection') continue; // Saltar colección de prueba
      
      console.log(`\n🔄 Moviendo ${collection.name}...`);
      
      try {
        // Obtener todos los documentos de la colección en test
        const documents = await testConnection.db.collection(collection.name).find({}).toArray();
        
        if (documents.length > 0) {
          // Insertar en la base de datos correcta
          await mongoose.connection.db.collection(collection.name).insertMany(documents);
          console.log(`   ✅ Movidos ${documents.length} documentos`);
          totalMoved += documents.length;
        } else {
          console.log(`   ℹ️ No hay documentos en ${collection.name}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error moviendo ${collection.name}: ${error.message}`);
      }
    }
    
    // Cerrar conexión a test
    await testConnection.close();
    
    console.log(`\n🎉 ¡Datos movidos exitosamente!`);
    console.log(`📊 Total de documentos movidos: ${totalMoved}`);
    
    // Verificar que los datos están en la base de datos correcta
    console.log('\n🔍 Verificando datos en mobile-repair-ecommerce...');
    const finalCollections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of finalCollections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${count} documentos`);
    }
    
  } catch (error) {
    console.error('❌ Error moviendo datos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB Atlas');
  }
}

// Ejecutar movimiento de datos
moveDataToCorrectDatabase();





