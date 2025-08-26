"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Trash2 } from "lucide-react"
import { AppLogo } from "@/components/core/AppLogo"
import ProductosLimpieza from "@/components/cleaning/ProductosLimpieza"
import { useRouter } from "next/navigation"
import { resetAllInventories } from "@/actions/reset-inventory"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HomePage() {
  const [currentView, setCurrentView] = useState<"home" | "productos-limpieza">("home")
  const [isLoading, setIsLoading] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [clearStatus, setClearStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const router = useRouter()

  const handleClearInventories = async () => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar todos los registros de inventario? Esta acción no se puede deshacer.",
      )
    ) {
      return
    }

    setIsClearing(true)
    setClearStatus(null)

    try {
      const result = await resetAllInventories()

      if (result.success) {
        setClearStatus({
          type: "success",
          message: "Todos los registros de inventario han sido eliminados correctamente.",
        })
      } else {
        setClearStatus({
          type: "error",
          message: result.error || "Error al limpiar los inventarios.",
        })
      }
    } catch (error) {
      console.error("Error clearing inventories:", error)
      setClearStatus({
        type: "error",
        message: "Ocurrió un error inesperado al limpiar los inventarios.",
      })
    } finally {
      setIsClearing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AppLogo size="large" className="mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (currentView === "productos-limpieza") {
    return <ProductosLimpieza onBack={() => setCurrentView("home")} showBackButton={true} />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con logo MPDL */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <AppLogo size="large" className="mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sistema de Inventarios MPDL</h1>
              <p className="text-gray-600">Gestión de Productos de Limpieza - Movimiento por la Paz</p>
            </div>
          </div>
        </div>

        {/* Alertas de estado */}
        {clearStatus && (
          <Alert variant={clearStatus.type === "error" ? "destructive" : "default"} className="mb-6">
            <AlertDescription>{clearStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Tarjetas de funcionalidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Productos de Limpieza
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Registra y gestiona el inventario de productos de limpieza por dispositivo.
              </p>
              <Button
                onClick={() => setCurrentView("productos-limpieza")}
                className="w-full bg-mpdl-blue text-white hover:bg-mpdl-blue-dark"
              >
                Acceder
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Resumen de Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Visualiza y descarga el resumen completo de inventarios en PDF.</p>
              <Button onClick={() => router.push("/summary")} variant="outline" className="w-full">
                Ver Resumen
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trash2 className="h-5 w-5 mr-2" />
                Limpiar Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Elimina todos los registros de inventario para empezar de nuevo.</p>
              <Button onClick={handleClearInventories} disabled={isClearing} variant="destructive" className="w-full">
                {isClearing ? "Limpiando..." : "Limpiar Todo"}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Probar Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Verificar el funcionamiento del registro y generación de PDFs.</p>
              <Button onClick={() => router.push("/test")} variant="outline" className="w-full">
                Ejecutar Pruebas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
