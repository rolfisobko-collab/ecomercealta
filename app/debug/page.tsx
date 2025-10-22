import FirebaseDebugger from "@/components/debug/FirebaseDebugger"

export default function DebugPage() {
  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <h1 className="text-3xl font-bold mb-6">Página de Depuración</h1>
      <FirebaseDebugger />
    </div>
  )
}
