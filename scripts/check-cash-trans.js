#!/usr/bin/env node

const { MongoClient } = require("mongodb");

const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function checkCashTransactions() {
  let mongoClient;
  
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db('test');
    
    const count = await db.collection('cashTransactions').countDocuments();
    console.log(`📊 Total cashTransactions: ${count}`);
    
    if (count > 0) {
      const sample = await db.collection('cashTransactions').findOne();
      console.log('\n📋 Sample transaction:');
      console.log(JSON.stringify(sample, null, 2));
      
      // Contar por tipo
      const pipeline = [
        { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ];
      const byType = await db.collection('cashTransactions').aggregate(pipeline).toArray();
      console.log('\n📊 By type:');
      byType.forEach(t => {
        console.log(`   ${t._id}: ${t.count} transactions, Total: $${t.total?.toLocaleString() || 0}`);
      });
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (mongoClient) await mongoClient.close();
  }
}

checkCashTransactions();
