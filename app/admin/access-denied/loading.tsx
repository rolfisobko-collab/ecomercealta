import { Skeleton } from "@/components/ui/skeleton"

export default function AccessDeniedLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-48 mt-6" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>

        <div className="pt-4">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
