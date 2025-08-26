"use server"

import { supabase } from "@/lib/supabase"

export async function resetAllInventories(): Promise<{ success: boolean; error?: string }> {
  try {
    // Eliminar todas las entradas de la tabla cleaning_inventories
    // Añadimos una condición WHERE que siempre será verdadera para eliminar todas las filas,
    // ya que la configuración de Supabase requiere una cláusula WHERE para DELETE.
    const { error } = await supabase
      .from("cleaning_inventories")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Condición para eliminar todas las filas

    if (error) {
      console.error("Error resetting inventories:", error)
      return { success: false, error: `Error al limpiar inventarios: ${error.message}` }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error resetting inventories:", error)
    return { success: false, error: "Ocurrió un error inesperado al limpiar los inventarios." }
  }
}
