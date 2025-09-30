"use server"

import { createClient } from "@supabase/supabase-js"
import { CLEANING_PRODUCTS_LIST } from "@/lib/constants"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function resetAllInventories(): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  try {
    console.log("🔄 Iniciando reseteo de todos los inventarios...")

    // Obtener todos los dispositivos únicos
    const { data: inventories, error: fetchError } = await supabase
      .from("cleaning_inventories")
      .select("device")
      .order("device", { ascending: true })

    if (fetchError) {
      console.error("❌ Error al obtener inventarios:", fetchError)
      return {
        success: false,
        message: "Error al obtener inventarios",
        error: fetchError.message,
      }
    }

    // Obtener dispositivos únicos
    const uniqueDevices = [...new Set(inventories?.map((inv) => inv.device) || [])]
    console.log(`📱 Dispositivos encontrados: ${uniqueDevices.length}`, uniqueDevices)

    // Crear productos con cantidad 0 para cada dispositivo
    const resetProducts = CLEANING_PRODUCTS_LIST.map((product) => ({
      productId: product.id,
      quantity: "0",
    }))

    // Insertar nuevos registros con todos los productos en 0 para cada dispositivo
    const resetPromises = uniqueDevices.map((device) =>
      supabase.from("cleaning_inventories").insert({
        device: device,
        products: resetProducts,
        created_at: new Date().toISOString(),
      }),
    )

    const results = await Promise.all(resetPromises)

    // Verificar si hubo errores
    const errors = results.filter((result) => result.error)
    if (errors.length > 0) {
      console.error("❌ Errores al resetear inventarios:", errors)
      return {
        success: false,
        message: "Error al resetear algunos inventarios",
        error: errors[0].error?.message,
      }
    }

    console.log(`✅ ${uniqueDevices.length} inventarios reseteados exitosamente`)
    return {
      success: true,
      message: `${uniqueDevices.length} inventarios reseteados a cero exitosamente`,
    }
  } catch (error) {
    console.error("❌ Error en resetAllInventories:", error)
    return {
      success: false,
      message: "Error inesperado al resetear inventarios",
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}
