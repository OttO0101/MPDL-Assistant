"use server"

import { put } from "@vercel/blob"
import { generateCleaningInventoryPdf } from "./generate-pdf"

export async function archivePdf() {
  try {
    console.log("🗂️ Iniciando proceso de archivado de PDF...")

    // Generar el PDF
    const pdfBuffer = await generateCleaningInventoryPdf()

    // Generar nombre de archivo con fecha
    const filename = await generateArchiveFilename()
    console.log(`📁 Nombre de archivo generado: ${filename}`)

    // Subir a Vercel Blob con configuración para evitar conflictos
    const blob = await put(filename, pdfBuffer, {
      access: "public",
      addRandomSuffix: true, // Esto evita conflictos de nombres
    })

    console.log(`✅ PDF archivado exitosamente en: ${blob.url}`)
    console.log(`📊 Tamaño del archivo: ${pdfBuffer.length} bytes`)

    return {
      success: true,
      url: blob.url,
      filename: blob.pathname, // Usar el pathname real del blob
      size: pdfBuffer.length,
    }
  } catch (error) {
    console.error("❌ Error durante el proceso de archivado:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido durante el archivado",
    }
  }
}

export async function generateArchiveFilename(): Promise<string> {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, "0")
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const year = now.getFullYear()

  return `archived-inventories/Productos_${day}-${month}-${year}.pdf`
}

// Función utilitaria para mostrar nombres de archivo amigables
export async function getDisplayFilename(filename: string): Promise<string> {
  // Extraer la fecha del nombre del archivo
  const match = filename.match(/Productos_(\d{2})-(\d{2})-(\d{4})/)
  if (match) {
    const [, day, month, year] = match
    return `Productos ${day}/${month}/${year}`
  }
  return filename
}

// Función para listar archivos archivados (preparada para futuro uso)
export async function getArchivedFiles(): Promise<any[]> {
  // Esta función se puede implementar cuando se necesite listar archivos archivados
  // Por ahora retorna un array vacío
  return []
}
