"use server"

import { put } from "@vercel/blob"
import { generateCleaningInventoryPdf } from "./generate-pdf"

export async function archivePdf(filename: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Generate the PDF first
    const pdfResult = await generateCleaningInventoryPdf()

    if (!pdfResult.success || !pdfResult.pdfBase64) {
      return { success: false, error: pdfResult.error || "Error al generar PDF" }
    }

    // Convert base64 to Buffer and then to Blob
    const pdfBuffer = Buffer.from(pdfResult.pdfBase64, "base64")
    const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" })

    // Upload to Vercel Blob
    const blob = await put(filename, pdfBlob, {
      access: "public",
      addRandomSuffix: true, // This will add a random suffix to avoid conflicts
    })

    return { success: true, url: blob.url }
  } catch (error: any) {
    console.error("Error archiving PDF to Vercel Blob:", error)
    return { success: false, error: `Error al archivar PDF: ${error.message}` }
  }
}
