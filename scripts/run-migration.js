#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando migración de Firebase a MongoDB...');

// Ejecutar el script de migración
const migrationScript = path.join(__dirname, 'migrate-to-mongodb.ts');

exec(`npx ts-node ${migrationScript}`, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  }
  
  if (stderr) {
    console.error('⚠️ Advertencias:', stderr);
  }
  
  console.log('📋 Salida de la migración:');
  console.log(stdout);
  
  console.log('✅ Migración completada');
});

