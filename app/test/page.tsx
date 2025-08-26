"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { AppLogo } from "@/components/core/AppLogo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { generateCleaningInventoryPdf } from "@/actions/generate-pdf"
import { CLEANING_PRODUCTS_LIST, DEVICE_OPTIONS } from "@/lib/constants"

interface TestResult {
  name: string
  status: "pending" | "running" | "success" | "error"
  message: string
  details?: string
}

export default function TestPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Conexión a Supabase", status: "pending", message: "Verificando conexión..." },
    { name: "Inserción de inventario", status: "pending", message: "Probando inserción..." },
    { name: "Lectura de inventarios", status: "pending", message: "Probando lectura..." },
    { name: "Generación de PDF", status: "pending", message: "Probando PDF..." },
    { name: "Limpieza de datos de prueba", status: "pending", message: "Limpiando..." },
  ])
  const [isRunning, setIsRunning] = useState(false)
  const router = useRouter()

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests((prev) => prev.map((test, i) => (i === index ? { ...test, ...updates } : test)))
  }

  const runTests = async () => {
    setIsRunning(true)

    // Test 1: Conexión a Supabase
    updateTest(0, { status: "running" })
    try {
      const { data, error } = await supabase.from("cleaning_inventories").select("count").limit(1)
      if (error) throw error
      updateTest(0, {
        status: "success",
        message: "Conexión exitosa",
        details: "Base de datos accesible",
      })
    } catch (error: any) {
      updateTest(0, {
        status: "error",
        message: "Error de conexión",
        details: error.message,
      })
      setIsRunning(false)
      return
    }

    // Test 2: Inserción de inventario
    updateTest(1, { status: "running" })
    let testInventoryId: number | null = null
    try {
      const testInventory = {
        device: "TEST_DEVICE",
        products: [
          { productId: CLEANING_PRODUCTS_LIST[0].id, quantity: "2" },
          { productId: CLEANING_PRODUCTS_LIST[1].id, quantity: "1" },
        ],
        reported_by: "Sistema de Pruebas MPDL",
        date: new Date().toISOString().split("T")[0],
      }

      const { data, error } = await supabase.from("cleaning_inventories").insert([testInventory]).select()

      if (error) throw error
      if (data && data.length > 0) {
        testInventoryId = data[0].id
      }

      updateTest(1, {
        status: "success",
        message: "Inserción exitosa",
        details: `Inventario creado con ID: ${testInventoryId}`,
      })
    } catch (error: any) {
      updateTest(1, {
        status: "error",
        message: "Error en inserción",
        details: error.message,
      })
    }

    // Test 3: Lectura de inventarios
    updateTest(2, { status: "running" })
    try {
      const { data, error } = await supabase.from("cleaning_inventories").select("*").eq("device", "TEST_DEVICE")

      if (error) throw error

      updateTest(2, {
        status: "success",
        message: "Lectura exitosa",
        details: `Encontrados ${data?.length || 0} registros de prueba`,
      })
    } catch (error: any) {
      updateTest(2, {
        status: "error",
        message: "Error en lectura",
        details: error.message,
      })
    }

    // Test 4: Generación de PDF
    updateTest(3, { status: "running" })
    try {
      const result = await generateCleaningInventoryPdf()

      if (result.success && result.pdfBase64) {
        const pdfSize = result.pdfBase64.length
        updateTest(3, {
          status: "success",
          message: "PDF generado exitosamente",
          details: `Tamaño: ${Math.round(pdfSize / 1024)} KB`,
        })
      } else {
        throw new Error(result.error || "Error desconocido")
      }
    } catch (error: any) {
      updateTest(3, {
        status: "error",
        message: "Error en generación de PDF",
        details: error.message,
      })
    }

    // Test 5: Limpieza de datos de prueba
    updateTest(4, { status: "running" })
    try {
      const { error } = await supabase.from("cleaning_inventories").delete().eq("device", "TEST_DEVICE")

      if (error) throw error

      updateTest(4, {
        status: "success",
        message: "Limpieza exitosa",
        details: "Datos de prueba eliminados",
      })
    } catch (error: any) {
      updateTest(4, {
        status: "error",
        message: "Error en limpieza",
        details: error.message,
      })
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return "border-gray-200"
      case "running":
        return "border-blue-200 bg-blue-50"
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
    }
  }

  const allTestsCompleted = tests.every((test) => test.status === "success" || test.status === "error")
  const hasErrors = tests.some((test) => test.status === "error")

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <AppLogo size="small" className="mr-3" />
          <h1 className="text-2xl font-bold">Pruebas del Sistema MPDL</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verificación de Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Esta página ejecuta pruebas automáticas para verificar que el sistema de inventarios MPDL funcione
                correctamente.
              </p>

              {!isRunning && !allTestsCompleted && (
                <Button onClick={runTests} className="mb-6">
                  Ejecutar Pruebas
                </Button>
              )}

              {allTestsCompleted && (
                <Alert variant={hasErrors ? "destructive" : "default"} className="mb-6">
                  <AlertDescription>
                    {hasErrors
                      ? "Algunas pruebas fallaron. Revisa los detalles abajo."
                      : "¡Todas las pruebas pasaron exitosamente! El sistema MPDL está funcionando correctamente."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {tests.map((test, index) => (
              <Card key={index} className={`border-2 ${getStatusColor(test.status)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h3 className="font-medium">{test.name}</h3>
                        <p className="text-sm text-gray-600">{test.message}</p>
                        {test.details && <p className="text-xs text-gray-500 mt-1">{test.details}</p>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {allTestsCompleted && !hasErrors && (
            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema MPDL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Dispositivos Configurados:</h4>
                    <p className="text-gray-600">{DEVICE_OPTIONS.length} dispositivos</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Productos de Limpieza:</h4>
                    <p className="text-gray-600">{CLEANING_PRODUCTS_LIST.length} productos</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Base de Datos:</h4>
                    <p className="text-gray-600">Supabase PostgreSQL</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Almacenamiento:</h4>
                    <p className="text-gray-600">Vercel Blob</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
