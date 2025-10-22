#!/usr/bin/env node

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  console.log('🔍 Probando conexión a MongoDB Atlas...');
  console.log(`📡 URI: ${MONGODB_URI.replace(/:[^:@]+@/, ':***@')}`);
  
  try {
    // Intentar conectar
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ ¡Conexión exitosa a MongoDB Atlas!');
    
    // Probar operaciones básicas
    console.log('🧪 Probando operaciones básicas...');
    
    // Listar bases de datos
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('📊 Bases de datos disponibles:', dbs.databases.map(db => db.name));
    
    // Crear una colección de prueba
    const testCollection = mongoose.connection.db.collection('test_connection');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('✅ Escritura de prueba exitosa');
    
    // Leer de la colección de prueba
    const result = await testCollection.findOne({ test: true });
    console.log('✅ Lectura de prueba exitosa:', result);
    
    // Limpiar colección de prueba
    await testCollection.deleteMany({ test: true });
    console.log('✅ Limpieza de prueba exitosa');
    
    console.log('\n🎉 ¡MongoDB Atlas está funcionando correctamente!');
    console.log('✅ Autenticación exitosa');
    console.log('✅ Permisos de lectura/escritura confirmados');
    console.log('✅ Listo para la migración');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔧 SOLUCIONES PARA ERROR DE AUTENTICACIÓN:');
      console.log('1. Verifica que la contraseña sea correcta');
      console.log('2. Confirma que el usuario tenga permisos');
      console.log('3. Verifica que la base de datos exista');
      console.log('4. Revisa la configuración de red en MongoDB Atlas');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔧 SOLUCIONES PARA ERROR DE TIMEOUT:');
      console.log('1. Verifica tu conexión a internet');
      console.log('2. Revisa la configuración de red en MongoDB Atlas');
      console.log('3. Confirma que la IP esté en la whitelist');
    } else {
      console.log('\n🔧 ERROR GENERAL:');
      console.log('1. Revisa la configuración de MongoDB Atlas');
      console.log('2. Verifica que el cluster esté activo');
      console.log('3. Confirma que las credenciales sean correctas');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB Atlas');
  }
}

// Ejecutar prueba
testConnection();





