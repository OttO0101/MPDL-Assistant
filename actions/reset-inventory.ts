"use server"

import { supabase } from "@/lib/supabase"

export async function resetAllInventories(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🔄 Iniciando limpieza de inventarios...")

    // Obtener todos los inventarios actuales
    const { data: inventories, error: fetchError } = await supabase.from("cleaning_inventories").select("*")

    if (fetchError) {
      console.error("Error fetching inventories:", fetchError)
      return { success: false, error: `Error al obtener inventarios: ${fetchError.message}` }
    }

    if (!inventories || inventories.length === 0) {
      console.log("No hay inventarios para limpiar")
      return { success: true }
    }

    console.log(`📊 Inventarios encontrados: ${inventories.length}`)

    // Agrupar por dispositivo y obtener el más reciente de cada uno
    const latestByDevice = new Map()
    inventories.forEach((inventory) => {
      const device = inventory.device
      if (
        !latestByDevice.has(device) ||
        new Date(inventory.updated_at) > new Date(latestByDevice.get(device).updated_at)
      ) {
        latestByDevice.set(device, inventory)
      }
    })

    console.log(`🔧 Dispositivos únicos: ${latestByDevice.size}`)

    // Para cada dispositivo, crear un nuevo registro con todos los productos en 0
    const resetPromises = Array.from(latestByDevice.values()).map(async (inventory) => {
      if (!inventory.products || typeof inventory.products !== "object") {
        return null
      }

      // Crear objeto con todos los productos en 0
      const resetProducts: Record<string, number> = {}
      Object.keys(inventory.products).forEach((productName) => {
        resetProducts[productName] = 0
      })

      // Insertar nuevo registro con productos en 0
      const { error: insertError } = await supabase.from("cleaning_inventories").insert([
        {
          device: inventory.device,
          products: resetProducts,
          reported_by: "Sistema - Reset Automático",
          date: new Date().toISOString().split("T")[0],
        },
      ])

      if (insertError) {
        console.error(`Error resetting device ${inventory.device}:`, insertError)
        throw insertError
      }

      console.log(`✅ Dispositivo ${inventory.device} limpiado`)
      return inventory.device
    })

    // Ejecutar todas las operaciones de reset
    const results = await Promise.all(resetPromises)
    const successfulResets = results.filter((result) => result !== null)

    console.log(`✅ Limpieza completada. ${successfulResets.length} dispositivos procesados`)

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error resetting inventories:", error)
    return { success: false, error: "Ocurrió un error inesperado al limpiar los inventarios." }
  }
}
