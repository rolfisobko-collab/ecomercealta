#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 INICIANDO MIGRACIÓN COMPLETA: Firebase → MongoDB Atlas');
console.log('=' * 60);

async function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 ${description}...`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error en ${description}:`, error.message);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.log(`⚠️ Advertencias: ${stderr}`);
      }
      
      if (stdout) {
        console.log(`📋 Salida: ${stdout}`);
      }
      
      console.log(`✅ ${description} completado`);
      resolve();
    });
  });
}

async function checkEnvironment() {
  console.log('\n🔍 Verificando configuración del entorno...');
  
  // Verificar si existe .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️ No se encontró .env.local, creando desde env.example...');
    
    const envExamplePath = path.join(process.cwd(), 'env.example');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Archivo .env.local creado');
      console.log('📝 IMPORTANTE: Actualiza las credenciales de MongoDB en .env.local');
    } else {
      console.log('❌ No se encontró env.example');
      throw new Error('Archivo de configuración no encontrado');
    }
  } else {
    console.log('✅ Archivo .env.local encontrado');
  }
  
  // Verificar dependencias
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.dependencies.mongodb || !packageJson.dependencies.mongoose) {
    console.log('❌ Dependencias de MongoDB no encontradas');
    throw new Error('Instala las dependencias primero: pnpm install');
  }
  
  console.log('✅ Dependencias verificadas');
}

async function main() {
  try {
    // 1. Verificar entorno
    await checkEnvironment();
    
    // 2. Actualizar importaciones
    await runCommand('pnpm run update-imports', 'Actualizando importaciones');
    
    // 3. Ejecutar migración
    await runCommand('pnpm run migrate', 'Migrando datos de Firebase a MongoDB');
    
    // 4. Verificar migración
    await runCommand('pnpm run verify', 'Verificando migración');
    
    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('=' * 60);
    console.log('✅ Datos migrados de Firebase a MongoDB Atlas');
    console.log('✅ Servicios híbridos configurados');
    console.log('✅ Importaciones actualizadas');
    console.log('✅ Sistema verificado y funcionando');
    
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Actualiza las credenciales de MongoDB en .env.local');
    console.log('2. Configura DATABASE_PROVIDER=mongodb en .env.local');
    console.log('3. Reinicia la aplicación: pnpm run dev');
    console.log('4. Prueba todas las funcionalidades');
    
    console.log('\n🆘 Si necesitas rollback:');
    console.log('- Cambia DATABASE_PROVIDER=firebase en .env.local');
    console.log('- Reinicia la aplicación');
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA MIGRACIÓN:', error.message);
    console.log('\n🔧 SOLUCIONES:');
    console.log('1. Verifica que MongoDB Atlas esté configurado correctamente');
    console.log('2. Confirma que las credenciales sean correctas');
    console.log('3. Asegúrate de que Firebase esté funcionando para la migración');
    console.log('4. Revisa los logs anteriores para más detalles');
    
    process.exit(1);
  }
}

// Ejecutar migración completa
main();





