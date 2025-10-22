import { connectToDatabase } from "@/lib/mongodb"

export async function getAllCashTransactions() {
  try {
    const { db } = await connectToDatabase()
    const transactions = await db.collection('cashTransactions')
      .find({})
      .sort({ time: -1 })
      .toArray()
    
    console.log(`✅ Loaded ${transactions.length} cash transactions from MongoDB`)
    
    return transactions.map(t => {
      const { _id, ...rest } = t
      return {
        ...rest,
        id: _id?.toString() || _id
      }
    })
  } catch (error) {
    console.error("❌ Error getting cash transactions:", error)
    console.error(error)
    return []
  }
}

export async function getCashTransactionsByDebt() {
  try {
    const { db } = await connectToDatabase()
    const transactions = await db.collection('cashTransactions')
      .find({ 
        isDebt: true,
        receivable: { $gt: 0 }
      })
      .sort({ receivable: -1, time: -1 })
      .toArray()
    
    return transactions.map(t => ({
      ...t,
      id: t._id.toString(),
      _id: undefined
    }))
  } catch (error) {
    console.error("Error getting debt transactions:", error)
    return []
  }
}

export async function updateCashTransaction(id: string, data: any) {
  try {
    const { db } = await connectToDatabase()
    await db.collection('cashTransactions').updateOne(
      { _id: id as any },
      { $set: data }
    )
    return true
  } catch (error) {
    console.error("Error updating cash transaction:", error)
    return false
  }
}

export async function deleteCashTransaction(id: string) {
  try {
    const { db } = await connectToDatabase()
    await db.collection('cashTransactions').deleteOne({ _id: id as any })
    return true
  } catch (error) {
    console.error("Error deleting cash transaction:", error)
    return false
  }
}
