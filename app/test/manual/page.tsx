"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download } from "lucide-react"
import { AppLogo } from "@/components/core/AppLogo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import InventoryTestForm from "@/components/test/InventoryTestForm"
import { generateCleaningInventoryPdf } from "@/actions/generate-pdf"

export default function ManualTestPage() {
  const [testResults, setTestResults] = useState<Array<{ type: "success" | "error"; message: string }>>([])
  const [pdfData, setPdfData] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const router = useRouter()

  const handleTestComplete = (success: boolean, message: string) => {
    setTestResults((prev) => [...prev, { type: success ? "success" : "error", message }])
  }

  const generateTestPdf = async () => {
    setIsGeneratingPdf(true)
    try {
      const result = await generateCleaningInventoryPdf()
      if (result.success && result.pdfBase64) {
        setPdfData(result.pdfBase64)
        handleTestComplete(true, "PDF generado correctamente")
      } else {
        handleTestComplete(false, result.error || "Error al generar PDF")
      }
    } catch (error: any) {
      handleTestComplete(false, `Error inesperado: ${error.message}`)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const downloadPdf = () => {
    if (!pdfData) return

    const blob = new Blob([Buffer.from(pdfData, "base64")], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "test-inventory-report-mpdl.pdf"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <AppLogo size="small" className="mr-3" />
          <h1 className="text-2xl font-bold">Pruebas Manuales - Sistema MPDL</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <InventoryTestForm onTestComplete={handleTestComplete} />

            <Card>
              <CardHeader>
                <CardTitle>Generar PDF de Prueba</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Genera un PDF con todos los inventarios actuales para verificar el formato y el logo de MPDL.
                </p>
                <div className="space-y-3">
                  <Button onClick={generateTestPdf} disabled={isGeneratingPdf} className="w-full">
                    {isGeneratingPdf ? "Generando..." : "Generar PDF"}
                  </Button>

                  {pdfData && (
                    <Button onClick={downloadPdf} variant="outline" className="w-full bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resultados de Pruebas</CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <p className="text-gray-500">No hay resultados aún...</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <Alert key={index} variant={result.type === "error" ? "destructive" : "default"}>
                        <AlertDescription>{result.message}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {pdfData && (
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa del PDF</CardTitle>
                </CardHeader>
                <CardContent>
                  <iframe
                    src={`data:application/pdf;base64,${pdfData}`}
                    width="100%"
                    height="400px"
                    style={{ border: "1px solid #ccc" }}
                    title="PDF Preview"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
