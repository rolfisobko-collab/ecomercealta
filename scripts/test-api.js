#!/usr/bin/env node

const fetch = require('node-fetch');

async function testAPIs() {
  try {
    console.log('🧪 Testing APIs...\n');
    
    // Test products API
    console.log('1️⃣ Testing /api/products');
    const productsRes = await fetch('http://localhost:3000/api/products');
    const products = await productsRes.json();
    console.log(`   ✅ Products: ${products.length}`);
    if (products.length > 0) {
      console.log(`   📦 Example:`, products[0]);
    }
    
    // Test cash-transactions API
    console.log('\n2️⃣ Testing /api/cash-transactions');
    const transRes = await fetch('http://localhost:3000/api/cash-transactions');
    const transactions = await transRes.json();
    console.log(`   ✅ Transactions: ${transactions.length}`);
    if (transactions.length > 0) {
      console.log(`   💰 Example:`, transactions[0]);
      
      // Analizar tipos
      const tipos = new Map();
      transactions.forEach(t => {
        tipos.set(t.type, (tipos.get(t.type) || 0) + 1);
      });
      console.log(`   📊 Types:`, Object.fromEntries(tipos));
      
      // Calcular totales
      const ingresos = transactions.filter(t => t.type === 'Ingreso');
      const totalIngresos = ingresos.reduce((sum, t) => sum + (t.amount || 0), 0);
      console.log(`   💵 Total Ingresos: $${totalIngresos.toLocaleString()}`);
      
      const egresos = transactions.filter(t => t.type === 'Egreso');
      const totalEgresos = egresos.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
      console.log(`   💸 Total Egresos: $${totalEgresos.toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPIs();
