"use client"

import dynamic from "next/dynamic"

// Import the CategoryGrid component with no SSR to avoid the client hook being called during server rendering
const CategoryGrid = dynamic(() => import("@/components/category/CategoryGrid"), { ssr: false })

export function CategoryGridClient() {
  return <CategoryGrid />
}
