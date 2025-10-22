import { NextResponse } from "next/server"
import { getAllCashTransactions, getCashTransactionsByDebt } from "@/services/mongodb/cashTransactionService"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    
    let transactions
    if (type === "debts") {
      transactions = await getCashTransactionsByDebt()
    } else {
      transactions = await getAllCashTransactions()
    }
    
    return NextResponse.json(transactions)
  } catch (error) {
    console.error("/api/cash-transactions GET error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
