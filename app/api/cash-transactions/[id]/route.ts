import { NextResponse } from "next/server"
import { updateCashTransaction, deleteCashTransaction } from "@/services/mongodb/cashTransactionService"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const success = await updateCashTransaction(id, body)
    
    if (!success) {
      return NextResponse.json({ message: "Failed to update" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("/api/cash-transactions/[id] PATCH error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const success = await deleteCashTransaction(id)
    
    if (!success) {
      return NextResponse.json({ message: "Failed to delete" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("/api/cash-transactions/[id] DELETE error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
