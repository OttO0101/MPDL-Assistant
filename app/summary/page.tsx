"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Mail, Archive } from "lucide-react"
import { AppLogo } from "@/components/core/AppLogo"
import { generateCleaningInventoryPdf } from "@/actions/generate-pdf"
import { archivePdf } from "@/actions/archive-pdf"
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
          setError(result.error || "Error al generar el PDF")
        }
      } catch (err) {
        console.error("Error loading PDF:", err)
        setError("Error inesperado al cargar el PDF")
      } finally {
        setIsLoading(false)
      }
    }

    loadPdf()
  }, [])

  const handleDownload = () => {
    if (!pdfData) return

    const blob = new Blob([Buffer.from(pdfData, "base64")], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "resumen-inventario-limpieza.pdf"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    if (!pdfData) return

    const blob = new Blob([Buffer.from(pdfData, "base64")], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url)
    if (printWindow) {
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
      // Generate filename with current month/year
      const now = new Date()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const year = now.getFullYear()
      const filename = `Limpieza ${month}/${year}.pdf`

      // Archive the PDF
      const archiveResult = await archivePdf(filename)

      if (archiveResult.success) {
        // Reset all inventories after successful archiving
        const resetResult = await resetAllInventories()

        if (resetResult.success) {
          setArchiveStatus({
            type: "success",
            message:
              "PDF archivado correctamente y todos los inventarios han sido limpiados. Redirigiendo al inicio...",
          })

          // Redirect to home after 3 seconds
          setTimeout(() => {
            router.push("/")
          }, 3000)
        } else {
          setArchiveStatus({
            type: "error",
            message: `PDF archivado, pero error al limpiar inventarios: ${resetResult.error}`,
          })
        }
      } else {
        setArchiveStatus({
          type: "error",
          message: archiveResult.error || "Error al archivar el PDF",
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
              <p className="text-gray-600">Generando PDF...</p>
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
          {/* PDF Viewer */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa del PDF</CardTitle>
              </CardHeader>
              <CardContent>
                {pdfData && (
                  <iframe
                    src={`data:application/pdf;base64,${pdfData}`}
                    width="100%"
                    height="600px"
                    style={{ border: "none" }}
                    title="PDF Preview"
                  />
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
                <Button onClick={handleDownload} className="w-full" disabled={!pdfData || isArchiving}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
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
                  Este resumen contiene todos los inventarios de productos de limpieza registrados en el sistema.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Al hacer clic en "Archivar y Limpiar", el PDF se guardará y todos los registros se eliminarán para
                  empezar de nuevo.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
