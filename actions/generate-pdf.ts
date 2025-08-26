"use server"

import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { supabase } from "@/lib/supabase"
import { CLEANING_PRODUCTS_LIST } from "@/lib/constants"

interface ProductQuantity {
  productId: string
  quantity: string
}

interface CleaningInventory {
  id?: number
  device: string
  products: ProductQuantity[]
  reported_by: string
  date: string
  created_at?: string
}

export async function generateCleaningInventoryPdf(): Promise<{
  success: boolean
  pdfBase64?: string
  error?: string
}> {
  try {
    // Fetch all inventories from Supabase
    const { data: inventories, error } = await supabase
      .from("cleaning_inventories")
      .select("*")
      .order("created_at", { ascending: true }) // Ordenar por fecha para construcción progresiva

    if (error) {
      console.error("Error fetching inventories for PDF:", error)
      return { success: false, error: `Error al obtener inventarios: ${error.message}` }
    }

    if (!inventories || inventories.length === 0) {
      return { success: false, error: "No hay inventarios para generar el PDF." }
    }

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Cargar el logo haciendo una solicitud HTTP a su URL pública
    let logoBytes: Uint8Array | undefined
    try {
      const logoUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/mpdl-logo.png`
        : "http://localhost:3000/mpdl-logo.png" // Fallback para desarrollo local
      const response = await fetch(logoUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch logo: ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      logoBytes = new Uint8Array(arrayBuffer)
    } catch (fetchError) {
      console.error("Error fetching logo:", fetchError)
      // Continuar sin logo si no se puede cargar
    }

    let logoImage = null
    if (logoBytes) {
      logoImage = await pdfDoc.embedPng(logoBytes)
    }

    let currentPage = pdfDoc.addPage()
    let yPosition = currentPage.getHeight() - 50
    const margin = 50
    const lineHeight = 15
    const sectionSpacing = 25

    const addHeader = () => {
      if (logoImage) {
        currentPage.drawImage(logoImage, {
          x: margin,
          y: currentPage.getHeight() - 40,
          width: 30,
          height: 30,
        })
      }
      currentPage.drawText("Resumen de Inventario de Productos de Limpieza - MPDL", {
        x: margin + (logoImage ? 40 : 0),
        y: currentPage.getHeight() - 30,
        font: boldFont,
        size: 14,
        color: rgb(0.117, 0.482, 0.721), // MPDL Blue
      })
      currentPage.drawLine({
        start: { x: margin, y: currentPage.getHeight() - 45 },
        end: { x: currentPage.getWidth() - margin, y: currentPage.getHeight() - 45 },
        color: rgb(0.117, 0.482, 0.721),
        thickness: 1,
      })
      yPosition = currentPage.getHeight() - 70 // Reset yPosition after header
    }

    addHeader()

    if (!inventories || inventories.length === 0) {
      currentPage.drawText("No hay datos de inventario disponibles.", {
        x: margin,
        y: yPosition,
        font: font,
        size: 12,
        color: rgb(0, 0, 0),
      })
    } else {
      for (const inventory of inventories as CleaningInventory[]) {
        // Check if new page is needed
        if (yPosition < margin + 100) {
          // Leave space for a new section
          currentPage = pdfDoc.addPage()
          yPosition = currentPage.getHeight() - 50
          addHeader()
        }

        currentPage.drawText(`Dispositivo: ${inventory.device}`, {
          x: margin,
          y: yPosition,
          font: boldFont,
          size: 12,
          color: rgb(0, 0, 0),
        })
        yPosition -= lineHeight

        currentPage.drawText(`Reportado por: ${inventory.reported_by} el ${inventory.date}`, {
          x: margin,
          y: yPosition,
          font: font,
          size: 10,
          color: rgb(0.3, 0.3, 0.3),
        })
        yPosition -= lineHeight * 1.5

        if (inventory.products && inventory.products.length > 0) {
          currentPage.drawText("Productos:", {
            x: margin + 10,
            y: yPosition,
            font: boldFont,
            size: 10,
            color: rgb(0, 0, 0),
          })
          yPosition -= lineHeight

          // Lógica de una sola columna (revertida)
          for (const product of inventory.products) {
            const productName =
              CLEANING_PRODUCTS_LIST.find((p) => p.id === product.productId)?.name || product.productId
            const productText = `- ${productName}: ${product.quantity}`

            if (yPosition < margin + lineHeight) {
              // Check if product line fits
              currentPage = pdfDoc.addPage()
              yPosition = currentPage.getHeight() - 50
              addHeader()
              currentPage.drawText(`Productos (cont. para ${inventory.device}):`, {
                x: margin + 10,
                y: yPosition,
                font: boldFont,
                size: 10,
                color: rgb(0, 0, 0),
              })
              yPosition -= lineHeight
            }

            currentPage.drawText(productText, {
              x: margin + 20,
              y: yPosition,
              font: font,
              size: 10,
              color: rgb(0, 0, 0),
            })
            yPosition -= lineHeight
          }
        } else {
          currentPage.drawText("No se registraron productos para este dispositivo.", {
            x: margin + 10,
            y: yPosition,
            font: font,
            size: 10,
            color: rgb(0.5, 0.5, 0.5),
          })
          yPosition -= lineHeight
        }
        yPosition -= sectionSpacing // Space between device sections
      }
    }

    const pdfBytes = await pdfDoc.save()
    return { success: true, pdfBase64: Buffer.from(pdfBytes).toString("base64") }
  } catch (err: any) {
    console.error("Error generating PDF:", err)
    return { success: false, error: "Error interno al generar el PDF." }
  }
}
