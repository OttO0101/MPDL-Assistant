"use server"

import { createClient } from "@supabase/supabase-js"
import { CLEANING_PRODUCTS_LIST } from "@/lib/constants"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface ProductQuantity {
  productId: string
  quantity: string
}

export async function generateCleaningInventoryPdf(): Promise<{
  success: boolean
  pdfBase64?: string
  error?: string
}> {
  try {
    console.log("🔄 Iniciando generación de PDF...")

    // Obtener todos los inventarios de la base de datos
    const { data: inventories, error } = await supabase
      .from("cleaning_inventories")
      .select("*")
      .order("device", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error al obtener inventarios:", error)
      return {
        success: false,
        error: `Error al obtener datos: ${error.message}`,
      }
    }

    console.log(`📊 Inventarios obtenidos: ${inventories?.length || 0}`)
    console.log("Inventarios raw:", JSON.stringify(inventories, null, 2))

    // Agrupar inventarios por dispositivo (tomar el más reciente de cada dispositivo)
    const latestInventories = new Map()
    inventories?.forEach((inventory) => {
      const deviceName = inventory.device
      if (!latestInventories.has(deviceName)) {
        latestInventories.set(deviceName, inventory)
      }
    })

    console.log(`🔧 Dispositivos únicos procesados: ${latestInventories.size}`)

    // Calcular LAC Consolidado
    const lacConsolidated = calculateLacConsolidated(Array.from(latestInventories.values()))

    // Generar PDF como listado simple
    const pdfContent = generatePdfContent(Array.from(latestInventories.values()), lacConsolidated)

    console.log("✅ PDF generado exitosamente")
    return {
      success: true,
      pdfBase64: pdfContent,
    }
  } catch (error) {
    console.error("❌ Error en generateCleaningInventoryPdf:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

function getProductNameById(productId: string): string {
  const product = CLEANING_PRODUCTS_LIST.find((p) => p.id === productId)
  return product ? product.name : productId
}

function calculateLacConsolidated(inventories: any[]) {
  console.log("🧮 Calculando LAC Consolidado...")

  const lacDevices = inventories.filter((inv) => inv.device && inv.device.match(/^LAC[1-6]$/i))

  console.log(`📱 Dispositivos LAC encontrados: ${lacDevices.length}`)

  if (lacDevices.length === 0) {
    return null
  }

  const consolidated: any = {
    device: "LAC (Consolidado)",
    products: [],
    updated_at: new Date().toISOString(),
  }

  // Objeto para acumular las cantidades por producto
  const productSums: Record<string, number> = {}

  // Sumar las cantidades de todos los dispositivos LAC
  lacDevices.forEach((device) => {
    console.log(`Procesando LAC device: ${device.device}`, device.products)

    if (Array.isArray(device.products)) {
      device.products.forEach((prod: ProductQuantity) => {
        const quantity = Number.parseInt(prod.quantity, 10)
        if (!isNaN(quantity) && quantity > 0) {
          productSums[prod.productId] = (productSums[prod.productId] || 0) + quantity
        }
      })
    }
  })

  // Convertir el objeto de sumas a array de ProductQuantity
  consolidated.products = Object.entries(productSums).map(([productId, quantity]) => ({
    productId,
    quantity: quantity.toString(),
  }))

  console.log(`📊 Productos consolidados:`, consolidated.products)
  return consolidated
}

function generatePdfContent(inventories: any[], lacConsolidated: any): string {
  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Crear contenido del PDF como texto plano estructurado
  let content = `INVENTARIO DE PRODUCTOS DE LIMPIEZA - MPDL
Movimiento por la Paz - Desarme y Democracia

Fecha de generación: ${currentDate}

================================================================================

`

  // Agregar inventarios regulares
  inventories.forEach((inventory, index) => {
    const deviceDate = inventory.created_at
      ? new Date(inventory.created_at).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Fecha no disponible"

    content += `${index + 1}. DISPOSITIVO: ${inventory.device || "Sin nombre"}
   Última actualización: ${deviceDate}
   
   PRODUCTOS:
`

    if (Array.isArray(inventory.products) && inventory.products.length > 0) {
      const validProducts = inventory.products.filter((p: ProductQuantity) => p.quantity && p.quantity !== "0")

      if (validProducts.length > 0) {
        validProducts.forEach((prod: ProductQuantity) => {
          const productName = getProductNameById(prod.productId)
          content += `   - ${productName}: ${prod.quantity}\n`
        })
      } else {
        content += `   - No hay productos registrados con cantidad mayor a 0\n`
      }
    } else {
      content += `   - No hay productos registrados\n`
    }

    content += `\n`
  })

  // Agregar LAC Consolidado si existe
  if (lacConsolidated && Array.isArray(lacConsolidated.products) && lacConsolidated.products.length > 0) {
    content += `================================================================================

LAC CONSOLIDADO
Suma total de todos los dispositivos LAC1, LAC2, LAC3, LAC4, LAC5 y LAC6

Consolidado generado: ${new Date(lacConsolidated.updated_at).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}

PRODUCTOS CONSOLIDADOS:
`

    const validConsolidated = lacConsolidated.products.filter((p: ProductQuantity) => p.quantity && p.quantity !== "0")

    if (validConsolidated.length > 0) {
      validConsolidated.forEach((prod: ProductQuantity) => {
        const productName = getProductNameById(prod.productId)
        content += `- ${productName}: ${prod.quantity}\n`
      })
    }

    content += `\n`
  }

  content += `================================================================================

Sistema de Inventarios MPDL
Generado automáticamente • Todos los datos son confidenciales

================================================================================`

  // Convertir a base64 para simular PDF
  return Buffer.from(content, "utf-8").toString("base64")
}
