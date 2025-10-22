import { NextResponse } from "next/server"
import { clearSession } from "@/services/auth/sessionService"

export async function POST() {
  clearSession()
  return NextResponse.json({ success: true })
}
