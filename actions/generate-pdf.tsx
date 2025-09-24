"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("❌ Error al obtener inventarios:", error)
      return {
        success: false,
        error: `Error al obtener datos: ${error.message}`,
      }
    }

    console.log(`📊 Inventarios obtenidos: ${inventories?.length || 0}`)

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

function calculateLacConsolidated(inventories: any[]) {
  console.log("🧮 Calculando LAC Consolidado...")

  const lacDevices = inventories.filter((inv) => inv.device && inv.device.match(/^LAC[1-6]$/i))

  console.log(`📱 Dispositivos LAC encontrados: ${lacDevices.length}`)

  if (lacDevices.length === 0) {
    return null
  }

  const consolidated: any = {
    device: "LAC (Consolidado)",
    products: {},
    updated_at: new Date().toISOString(),
  }

  // Sumar las cantidades de todos los dispositivos LAC
  lacDevices.forEach((device) => {
    if (device.products && typeof device.products === "object") {
      Object.entries(device.products).forEach(([productName, quantity]) => {
        if (typeof quantity === "number" && quantity > 0) {
          consolidated.products[productName] = (consolidated.products[productName] || 0) + quantity
        }
      })
    }
  })

  console.log(`📊 Productos consolidados: ${Object.keys(consolidated.products).length}`)
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
    const deviceDate = inventory.updated_at
      ? new Date(inventory.updated_at).toLocaleDateString("es-ES", {
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

    if (inventory.products && typeof inventory.products === "object") {
      const products = Object.entries(inventory.products).filter(
        ([_, quantity]) => typeof quantity === "number" && quantity > 0,
      )

      if (products.length > 0) {
        products.forEach(([productName, quantity]) => {
          content += `   - ${productName}: ${quantity} unidades\n`
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
  if (lacConsolidated && Object.keys(lacConsolidated.products).length > 0) {
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

    const consolidatedProducts = Object.entries(lacConsolidated.products).filter(
      ([_, quantity]) => typeof quantity === "number" && quantity > 0,
    )

    if (consolidatedProducts.length > 0) {
      consolidatedProducts.forEach(([productName, quantity]) => {
        content += `- ${productName}: ${quantity} unidades\n`
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
