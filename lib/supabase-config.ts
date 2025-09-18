// lib/supabase-config.ts
// Configuración optimizada de Supabase para el sistema MPDL

import { createClient } from "@supabase/supabase-js"

// Configuración del cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Cliente para operaciones del lado del cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Deshabilitado para evitar problemas en SSR
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-application-name": "mpdl-inventory-system",
    },
  },
})

// Cliente con privilegios de servicio para operaciones administrativas
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "public",
      },
    })
  : null

// Tipos TypeScript para la base de datos
export interface CleaningInventory {
  id: number
  device: string
  products: ProductQuantity[]
  reported_by: string
  date: string
  created_at: string
  updated_at: string
}

export interface ProductQuantity {
  productId: string
  quantity: string
}

// Funciones utilitarias para operaciones comunes
export class SupabaseService {
  // Obtener todos los inventarios
  static async getAllInventories(): Promise<CleaningInventory[]> {
    const { data, error } = await supabase
      .from("cleaning_inventories")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching inventories:", error)
      throw new Error(`Error al obtener inventarios: ${error.message}`)
    }

    return data || []
  }

  // Obtener inventario más reciente por dispositivo
  static async getLatestInventoryByDevice(device: string): Promise<CleaningInventory | null> {
    const { data, error } = await supabase
      .from("cleaning_inventories")
      .select("*")
      .eq("device", device)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching latest inventory:", error)
      throw new Error(`Error al obtener inventario: ${error.message}`)
    }

    return data || null
  }

  // Insertar nuevo inventario
  static async insertInventory(inventory: Omit<CleaningInventory, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase.from("cleaning_inventories").insert([inventory]).select()

    if (error) {
      console.error("Error inserting inventory:", error)
      throw new Error(`Error al insertar inventario: ${error.message}`)
    }

    return data?.[0] || null
  }

  // Eliminar todos los inventarios
  static async clearAllInventories() {
    const { error } = await supabase.from("cleaning_inventories").delete().neq("id", 0)

    if (error) {
      console.error("Error clearing inventories:", error)
      throw new Error(`Error al limpiar inventarios: ${error.message}`)
    }

    return true
  }

  // Obtener inventarios LAC para consolidación
  static async getLacInventories(): Promise<CleaningInventory[]> {
    const { data, error } = await supabase
      .from("cleaning_inventories")
      .select("*")
      .in("device", ["LAC1", "LAC2", "LAC3", "LAC4", "LAC5", "LAC6"])
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching LAC inventories:", error)
      throw new Error(`Error al obtener inventarios LAC: ${error.message}`)
    }

    return data || []
  }

  // Verificar conexión a Supabase
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from("cleaning_inventories").select("count").limit(1)

      if (error) {
        console.error("Connection test failed:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Connection test error:", error)
      return false
    }
  }

  // Obtener estadísticas del sistema
  static async getSystemStats() {
    try {
      const { data, error } = await supabase
        .from("cleaning_inventories")
        .select("device, created_at")
        .order("created_at", { ascending: false })

      if (error) throw error

      const stats = {
        totalRecords: data?.length || 0,
        uniqueDevices: new Set(data?.map((item) => item.device)).size,
        lastUpdate: data?.[0]?.created_at || null,
        deviceCounts: data?.reduce(
          (acc, item) => {
            acc[item.device] = (acc[item.device] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ),
      }

      return stats
    } catch (error) {
      console.error("Error getting system stats:", error)
      throw error
    }
  }
}

// Configuración de realtime (opcional)
export const setupRealtimeSubscription = (callback: (payload: any) => void) => {
  const subscription = supabase
    .channel("cleaning_inventories_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "cleaning_inventories" }, callback)
    .subscribe()

  return subscription
}

// Función para limpiar suscripciones
export const cleanupSubscription = (subscription: any) => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
}
