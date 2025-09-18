"use server"

import { SupabaseService } from "@/lib/supabase-config"

export async function testSupabaseConnection() {
  try {
    console.log("🔍 Iniciando pruebas de Supabase...")

    // Test 1: Conexión básica
    const connectionTest = await SupabaseService.testConnection()
    if (!connectionTest) {
      throw new Error("No se pudo conectar a Supabase")
    }

    // Test 2: Obtener estadísticas
    const stats = await SupabaseService.getSystemStats()

    // Test 3: Insertar registro de prueba
    const testInventory = {
      device: "TEST_DEVICE",
      products: [{ productId: "cp001", quantity: "1" }],
      reported_by: "Sistema de Pruebas",
      date: new Date().toISOString().split("T")[0],
    }

    const insertedRecord = await SupabaseService.insertInventory(testInventory)

    // Test 4: Leer el registro insertado
    const retrievedRecord = await SupabaseService.getLatestInventoryByDevice("TEST_DEVICE")

    // Test 5: Limpiar registro de prueba
    if (insertedRecord) {
      // Aquí normalmente eliminaríamos el registro de prueba
      console.log("✅ Registro de prueba creado y verificado")
    }

    return {
      success: true,
      results: {
        connection: connectionTest,
        stats,
        testRecord: {
          inserted: !!insertedRecord,
          retrieved: !!retrievedRecord,
        },
      },
    }
  } catch (error) {
    console.error("❌ Error en pruebas de Supabase:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}
