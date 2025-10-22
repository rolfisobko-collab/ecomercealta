#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔄 Actualizando importaciones para usar servicios híbridos...');

// Archivos que necesitan ser actualizados
const filesToUpdate = [
  'app/api',
  'components',
  'hooks',
  'context'
];

// Función para buscar y reemplazar importaciones
function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Reemplazar importaciones de servicios de Firebase por servicios híbridos
    const replacements = [
      {
        from: /from ['"]@\/services\/api\/userService['"]/g,
        to: 'from "@/services/hybrid/userService"'
      },
      {
        from: /from ['"]@\/services\/api\/productService['"]/g,
        to: 'from "@/services/hybrid/productService"'
      },
      {
        from: /from ['"]@\/services\/api\/categoryService['"]/g,
        to: 'from "@/services/hybrid/categoryService"'
      },
      {
        from: /from ['"]@\/services\/api\/supplierService['"]/g,
        to: 'from "@/services/hybrid/supplierService"'
      },
      {
        from: /from ['"]@\/services\/api\/movementService['"]/g,
        to: 'from "@/services/hybrid/movementService"'
      },
      {
        from: /from ['"]@\/services\/api\/favoriteService['"]/g,
        to: 'from "@/services/hybrid/favoriteService"'
      },
      {
        from: /from ['"]@\/services\/api\/technicalServiceService['"]/g,
        to: 'from "@/services/hybrid/technicalServiceService"'
      }
    ];

    replacements.forEach(replacement => {
      if (replacement.from.test(content)) {
        content = content.replace(replacement.from, replacement.to);
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Actualizado: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error actualizando ${filePath}:`, error.message);
  }
}

// Función recursiva para buscar archivos
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  } catch (error) {
    // Ignorar errores de directorios que no existen
  }
  
  return files;
}

// Actualizar archivos
console.log('🔍 Buscando archivos para actualizar...');

filesToUpdate.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  const files = findFiles(fullPath);
  
  console.log(`📁 Procesando directorio: ${dir} (${files.length} archivos)`);
  
  files.forEach(file => {
    updateImportsInFile(file);
  });
});

console.log('✅ Actualización de importaciones completada');
console.log('');
console.log('📋 Resumen de cambios:');
console.log('- Servicios de Firebase → Servicios híbridos');
console.log('- Compatibilidad con MongoDB y Firebase');
console.log('- Sin cambios en la funcionalidad del frontend');
console.log('');
console.log('🚀 Ahora puedes ejecutar la migración con: pnpm run migrate');





