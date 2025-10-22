import { NextResponse } from "next/server"
import { connectToMongoDB } from "@/lib/mongoose"
import { TechnicalService as TechnicalServiceModel } from "@/models/mongodb/TechnicalService"

export async function POST() {
  try {
    await connectToMongoDB()

    const filter: any = {
      $or: [
        { name: { $exists: false } },
        { name: "" },
        { name: null },
      ],
    }

    const matched = await TechnicalServiceModel.countDocuments(filter)
    const result = await TechnicalServiceModel.deleteMany(filter)

    return NextResponse.json({ matched, deleted: result.deletedCount ?? 0 })
  } catch (err: any) {
    return new NextResponse(err?.message || "Failed to cleanup unnamed services", { status: 500 })
  }
}
