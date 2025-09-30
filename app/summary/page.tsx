"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Printer, Mail, Archive, Trash2, Loader2 } from "lucide-react"
import { generateCleaningInventoryPdf } from "@/actions/generate-pdf"
import { archivePdf } from "@/actions/archive-pdf"
import { resetAllInventories } from "@/actions/reset-inventory"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function SummaryPage() {
  const [pdfData, setPdfData] = useState<string | null>(null)
  const [pdfContent, setPdfContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)

  useEffect(() => {
    loadPdf()
  }, [])

  async function loadPdf() {
    setIsLoading(true)
    try {
      const result = await generateCleaningInventoryPdf()

      if (result.success && result.pdfBase64) {
        setPdfData(result.pdfBase64)
        // Decodificar el contenido para mostrarlo
        const decoded = Buffer.from(result.pdfBase64, "base64").toString("utf-8")
        setPdfContent(decoded)
        toast.success("PDF generado exitosamente")
      } else {
        toast.error(result.error || "Error al generar PDF")
      }
    } catch (error) {
      console.error("Error loading PDF:", error)
      toast.error("Error al cargar el PDF")
    } finally {
      setIsLoading(false)
    }
  }

  function handleDownload() {
    if (!pdfData) return

    const decoded = Buffer.from(pdfData, "base64").toString("utf-8")
    const blob = new Blob([decoded], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventario_limpieza_${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("PDF descargado")
  }

  function handlePrint() {
    if (!pdfContent) return

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Inventario de Productos de Limpieza</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                padding: 20px;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>${pdfContent}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
      toast.success("Documento enviado a imprimir")
    }
  }

  function handleEmail() {
    if (!pdfData) return

    const subject = encodeURIComponent("Inventario de Productos de Limpieza - MPDL")
    const body = encodeURIComponent(
      "Adjunto encontrarás el inventario de productos de limpieza generado automáticamente.\n\nSaludos,\nSistema MPDL",
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
    toast.info("Cliente de correo abierto")
  }

  async function handleArchive() {
    if (!pdfData) return

    setIsArchiving(true)
    try {
      const result = await archivePdf(pdfData)
      if (result.success) {
        toast.success("PDF archivado exitosamente")
      } else {
        toast.error(result.error || "Error al archivar PDF")
      }
    } catch (error) {
      console.error("Error archiving PDF:", error)
      toast.error("Error al archivar el PDF")
    } finally {
      setIsArchiving(false)
    }
  }

  async function handleReset() {
    setIsResetting(true)
    try {
      const result = await resetAllInventories()
      if (result.success) {
        toast.success(result.message)
        // Recargar el PDF después del reset
        await loadPdf()
      } else {
        toast.error(result.error || "Error al resetear inventarios")
      }
    } catch (error) {
      console.error("Error resetting inventories:", error)
      toast.error("Error al resetear los inventarios")
    } finally {
      setIsResetting(false)
      setShowResetDialog(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Resumen de Inventarios</h1>
        <p className="text-muted-foreground">Visualiza, descarga y gestiona el inventario de productos de limpieza</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF Generado
            </CardTitle>
            <CardDescription>Documento de inventario actualizado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pdfContent ? (
              <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">{pdfContent}</pre>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay PDF generado</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleDownload}
                disabled={!pdfData || isLoading}
                variant="outline"
                className="w-full bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Button
                onClick={handlePrint}
                disabled={!pdfData || isLoading}
                variant="outline"
                className="w-full bg-transparent"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
            <CardDescription>Gestiona el documento generado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleEmail}
              disabled={!pdfData || isLoading}
              variant="outline"
              className="w-full bg-transparent"
            >
              <Mail className="h-4 w-4 mr-2" />
              Enviar por Email
            </Button>

            <Button
              onClick={handleArchive}
              disabled={!pdfData || isLoading || isArchiving}
              variant="outline"
              className="w-full bg-transparent"
            >
              {isArchiving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Archivando...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Archivar PDF
                </>
              )}
            </Button>

            <div className="pt-4 border-t">
              <Button
                onClick={() => setShowResetDialog(true)}
                disabled={isLoading || isResetting}
                variant="destructive"
                className="w-full"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Limpiando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Inventarios
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Esta acción pondrá todos los contadores a cero
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción pondrá todos los contadores de inventario a cero para todos los dispositivos. Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground">
              Sí, limpiar inventarios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
