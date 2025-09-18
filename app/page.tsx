"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Trash2, Settings } from "lucide-react"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center floating-particles">
        <div className="text-center fade-in-up">
          <div className="glow-effect rounded-2xl p-4 mb-4">
            <AppLogo size="large" className="mx-auto" />
          </div>
          <p className="text-gray-600 text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  if (currentView === "productos-limpieza") {
    return <ProductosLimpieza onBack={() => setCurrentView("home")} showBackButton={true} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 floating-particles">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header con logo MPDL y efectos modernos */}
        <div className="flex items-center justify-between mb-12 fade-in-up">
          <div className="flex items-center">
            <div className="glow-effect rounded-2xl p-2 mr-6">
              <AppLogo size="large" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">Sistema de Inventarios MPDL</h1>
              <p className="text-lg text-slate-600">Gestión de Productos de Limpieza - Movimiento por la Paz</p>
            </div>
          </div>
        </div>

        {/* Alertas de estado */}
        {clearStatus && (
          <Alert
            variant={clearStatus.type === "error" ? "destructive" : "default"}
            className="mb-8 fade-in-up stagger-1"
          >
            <AlertDescription className="text-base">{clearStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Tarjetas de funcionalidades con efectos modernos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          <Card className="dynamic-card cursor-pointer fade-in-up stagger-1">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="h-6 w-6 mr-3 metallic-icon" />
                Productos de Limpieza
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6 text-base leading-relaxed">
                Registra y gestiona el inventario de productos de limpieza por dispositivo.
              </p>
              <Button
                onClick={() => setCurrentView("productos-limpieza")}
                className="modern-button w-full text-white font-medium py-3"
              >
                Acceder
              </Button>
            </CardContent>
          </Card>

          <Card className="dynamic-card fade-in-up stagger-2">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="h-6 w-6 mr-3 metallic-icon" />
                Resumen de Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6 text-base leading-relaxed">
                Visualiza y descarga el resumen completo de inventarios en PDF.
              </p>
              <Button
                onClick={() => router.push("/summary")}
                variant="outline"
                className="w-full py-3 border-2 border-corporate-primary text-corporate-primary hover:bg-corporate-primary hover:text-white transition-all duration-300"
              >
                Ver Resumen
              </Button>
            </CardContent>
          </Card>

          <Card className="dynamic-card fade-in-up stagger-3">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Trash2 className="h-6 w-6 mr-3 metallic-icon" />
                Limpiar Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6 text-base leading-relaxed">
                Elimina todos los registros de inventario para empezar de nuevo.
              </p>
              <Button
                onClick={handleClearInventories}
                disabled={isClearing}
                variant="destructive"
                className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300"
              >
                {isClearing ? "Limpiando..." : "Limpiar Todo"}
              </Button>
            </CardContent>
          </Card>

          <Card className="dynamic-card fade-in-up stagger-4">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Settings className="h-6 w-6 mr-3 metallic-icon" />
                Probar Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6 text-base leading-relaxed">
                Verificar el funcionamiento del registro y generación de PDFs.
              </p>
              <Button
                onClick={() => router.push("/test")}
                variant="outline"
                className="w-full py-3 border-2 border-corporate-primary text-corporate-primary hover:bg-corporate-primary hover:text-white transition-all duration-300"
              >
                Ejecutar Pruebas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
