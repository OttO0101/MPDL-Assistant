"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Mail, Archive, Eye } from "lucide-react"
import { AppLogo } from "@/components/core/AppLogo"
import { generateCleaningInventoryPdf } from "@/actions/generate-pdf"
import { archivePdf, generateArchiveFilename } from "@/actions/archive-pdf"
import { resetAllInventories } from "@/actions/reset-inventory"
import { sendEmailWithPdf } from "@/actions/send-email"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export default function SummaryPage() {
  const [pdfData, setPdfData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)
  const [archiveStatus, setArchiveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await generateCleaningInventoryPdf()

        if (result.success && result.pdfBase64) {
          setPdfData(result.pdfBase64)
        } else {
          setError(result.error || "Error al generar el reporte")
        }
      } catch (err) {
        console.error("Error loading PDF:", err)
        setError("Error inesperado al cargar el reporte")
      } finally {
        setIsLoading(false)
      }
    }

    loadPdf()
  }, [])

  const handleDownload = () => {
    if (!pdfData) return

    const htmlContent = Buffer.from(pdfData, "base64").toString("utf-8")
    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "resumen-inventario-limpieza.html"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleView = () => {
    if (!pdfData) return

    const htmlContent = Buffer.from(pdfData, "base64").toString("utf-8")
    const newWindow = window.open()
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
    }
  }

  const handlePrint = () => {
    if (!pdfData) return

    const htmlContent = Buffer.from(pdfData, "base64").toString("utf-8")
    const printWindow = window.open()
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handleEmail = async () => {
    if (!pdfData) return

    try {
      const result = await sendEmailWithPdf(pdfData)
      if (result.success) {
        alert("Email enviado correctamente")
      } else {
        alert(`Error al enviar email: ${result.error}`)
      }
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Error inesperado al enviar el email")
    }
  }

  const handleArchive = async () => {
    if (!pdfData) return

    setIsArchiving(true)
    setArchiveStatus(null)

    try {
      // Generate filename with current date
      const filename = await generateArchiveFilename()

      // Archive the PDF
      const archiveResult = await archivePdf(filename)

      if (archiveResult.success) {
        // Reset all inventories after successful archiving
        const resetResult = await resetAllInventories()

        if (resetResult.success) {
          setArchiveStatus({
            type: "success",
            message:
              "Reporte archivado correctamente y todos los inventarios han sido limpiados. Redirigiendo al inicio...",
          })

          // Redirect to home after 3 seconds
          setTimeout(() => {
            router.push("/")
          }, 3000)
        } else {
          setArchiveStatus({
            type: "error",
            message: `Reporte archivado, pero error al limpiar inventarios: ${resetResult.error}`,
          })
        }
      } else {
        setArchiveStatus({
          type: "error",
          message: archiveResult.error || "Error al archivar el reporte",
        })
      }
    } catch (error) {
      console.error("Error in archive process:", error)
      setArchiveStatus({
        type: "error",
        message: "Error inesperado durante el proceso de archivado",
      })
    } finally {
      setIsArchiving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <AppLogo size="small" className="mr-3" />
            <h1 className="text-2xl font-bold">Resumen de Inventario</h1>
          </div>

          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">Generando reporte...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <AppLogo size="small" className="mr-3" />
            <h1 className="text-2xl font-bold">Resumen de Inventario</h1>
          </div>

          <Card>
            <CardContent className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <AppLogo size="small" className="mr-3" />
          <h1 className="text-2xl font-bold">Resumen de Inventario</h1>
        </div>

        {archiveStatus && (
          <Alert variant={archiveStatus.type === "error" ? "destructive" : "default"} className="mb-6">
            <AlertDescription>{archiveStatus.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                {pdfData && (
                  <div className="text-center py-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 mb-4">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">📋 Reporte Generado Exitosamente</h3>
                      <p className="text-gray-600 mb-4">
                        El reporte contiene todos los inventarios de productos de limpieza registrados en el sistema
                        MPDL.
                      </p>
                      <div className="flex justify-center space-x-4">
                        <Button onClick={handleView} className="bg-blue-600 hover:bg-blue-700">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Reporte
                        </Button>
                        <Button onClick={handleDownload} variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Tamaño del reporte: {Math.round(pdfData.length / 1024)} KB</p>
                      <p>Formato: HTML optimizado para impresión</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleView} className="w-full" disabled={!pdfData || isArchiving}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Reporte
                </Button>

                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full bg-transparent"
                  disabled={!pdfData || isArchiving}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar HTML
                </Button>

                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="w-full bg-transparent"
                  disabled={!pdfData || isArchiving}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>

                <Button
                  onClick={handleEmail}
                  variant="outline"
                  className="w-full bg-transparent"
                  disabled={!pdfData || isArchiving}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar por Email
                </Button>

                <Button
                  onClick={handleArchive}
                  variant="destructive"
                  className="w-full"
                  disabled={!pdfData || isArchiving}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {isArchiving ? "Archivando..." : "Archivar y Limpiar"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Este reporte contiene todos los inventarios de productos de limpieza registrados en el sistema.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Al hacer clic en "Archivar y Limpiar", el reporte se guardará y todos los registros se eliminarán para
                  empezar de nuevo.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Nota:</strong> El reporte se genera en formato HTML optimizado para visualización e impresión.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
