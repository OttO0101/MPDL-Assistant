"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Package, Save } from "lucide-react"
import { AppLogo } from "@/components/core/AppLogo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DEVICE_OPTIONS,
  CLEANING_PRODUCTS_LIST,
  PRODUCT_SPECIFIC_QUANTITIES,
  MM_MF_PRODUCT_QUANTITIES,
  LAC_GROUP_DEFAULT_QUANTITIES,
  LAC_PAPEL_COCINA_QUANTITIES,
  PRODUCT_ID_PAPEL_COCINA,
  PRODUCT_ID_OTROS,
  LAC_CONSOLIDATED_INVENTORY_DEVICE,
  LAC_SUB_UNITS_FOR_SUM,
} from "@/lib/constants"
import { supabase } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { generateCleaningInventoryPdf } from "@/actions/generate-pdf"

interface ProductosLimpiezaProps {
  onBack: () => void
  showBackButton?: boolean
}

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

export default function ProductosLimpieza({ onBack, showBackButton = true }: ProductosLimpiezaProps) {
  const [selectedDevice, setSelectedDevice] = useState("")
  const [productQuantities, setProductQuantities] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lacSummaryQuantities, setLacSummaryQuantities] = useState<Record<string, number>>({})

  const fetchLacInventoriesFromSupabase = useCallback(async (): Promise<CleaningInventory[]> => {
    const { data, error } = await supabase
      .from("cleaning_inventories")
      .select("device, products")
      .in("device", LAC_SUB_UNITS_FOR_SUM)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching LAC inventories from Supabase:", error)
      setError("Error al cargar datos consolidados de LAC.")
      return []
    }

    // Agrupar por dispositivo y tomar solo el más reciente
    const latestByDevice = new Map<string, CleaningInventory>()
    data?.forEach((inv: CleaningInventory) => {
      if (!latestByDevice.has(inv.device)) {
        latestByDevice.set(inv.device, inv)
      }
    })

    return Array.from(latestByDevice.values())
  }, [])

  const calculateLacSummary = useCallback(async () => {
    setError(null)
    const lacInventories = await fetchLacInventoriesFromSupabase()

    console.log("LAC Inventories for consolidation:", lacInventories)

    const summedQuantities: Record<string, number> = {}

    CLEANING_PRODUCTS_LIST.forEach((product) => {
      if (product.id !== PRODUCT_ID_OTROS) {
        summedQuantities[product.id] = 0
      }
    })

    lacInventories.forEach((inventory) => {
      console.log(`Processing ${inventory.device}:`, inventory.products)

      if (Array.isArray(inventory.products)) {
        inventory.products.forEach((prodQty) => {
          if (prodQty.productId !== PRODUCT_ID_OTROS) {
            const quantity = Number.parseInt(prodQty.quantity, 10)
            if (!isNaN(quantity)) {
              summedQuantities[prodQty.productId] = (summedQuantities[prodQty.productId] || 0) + quantity
            }
          }
        })
      }
    })

    console.log("LAC Summary calculated:", summedQuantities)
    setLacSummaryQuantities(summedQuantities)
  }, [fetchLacInventoriesFromSupabase])

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const fetchInitialData = async () => {
      if (!selectedDevice) {
        setProductQuantities({})
        setLacSummaryQuantities({})
        return
      }

      setError(null)

      if (selectedDevice === LAC_CONSOLIDATED_INVENTORY_DEVICE) {
        await calculateLacSummary()
        setProductQuantities({})
      } else {
        const { data, error: fetchError } = await supabase
          .from("cleaning_inventories")
          .select("products")
          .eq("device", selectedDevice)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error fetching latest inventory:", fetchError)
          setError("Error al cargar el inventario anterior.")
          setProductQuantities({})
        } else if (data) {
          console.log("Loaded inventory data:", data)
          const initialQuantities: Record<string, string> = {}
          if (Array.isArray(data.products)) {
            data.products.forEach((p: ProductQuantity) => {
              initialQuantities[p.productId] = p.quantity
            })
          }
          console.log("Initial quantities:", initialQuantities)
          setProductQuantities(initialQuantities)
        } else {
          setProductQuantities({})
        }
        setLacSummaryQuantities({})
      }
    }

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel("cleaning_inventories_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "cleaning_inventories" }, (payload) => {
          const newInventory = payload.new as CleaningInventory
          const oldInventory = payload.old as CleaningInventory

          if (selectedDevice && newInventory && newInventory.device === selectedDevice) {
            const updatedQuantities: Record<string, string> = {}
            if (Array.isArray(newInventory.products)) {
              newInventory.products.forEach((p: ProductQuantity) => {
                updatedQuantities[p.productId] = p.quantity
              })
            }
            setProductQuantities(updatedQuantities)
            console.log(`Realtime update for ${selectedDevice}:`, updatedQuantities)
          } else if (selectedDevice === LAC_CONSOLIDATED_INVENTORY_DEVICE && (newInventory || oldInventory)) {
            const changedDevice = newInventory?.device || oldInventory?.device
            if (changedDevice && LAC_SUB_UNITS_FOR_SUM.includes(changedDevice)) {
              console.log(`Realtime change for LAC sub-unit ${changedDevice}, re-calculating consolidated.`)
              calculateLacSummary()
            }
          }
          // Trigger PDF regeneration on any relevant change
          console.log("Triggering PDF regeneration due to Supabase change.")
          generateCleaningInventoryPdf().then((result) => {
            if (result.error) {
              console.error("Error regenerating PDF:", result.error)
            } else {
              console.log("PDF regenerated successfully.")
            }
          })
        })
        .subscribe()
    }

    fetchInitialData()
    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
        console.log("Supabase Realtime channel unsubscribed.")
      }
    }
  }, [selectedDevice, calculateLacSummary])

  const getQuantityOptions = (productId: string, device: string): string[] => {
    if (device === "MM" || device === "MF") {
      return MM_MF_PRODUCT_QUANTITIES[productId] || ["0", "1"]
    }

    if (device.startsWith("LAC") && device !== LAC_CONSOLIDATED_INVENTORY_DEVICE) {
      if (productId === PRODUCT_ID_PAPEL_COCINA) {
        return LAC_PAPEL_COCINA_QUANTITIES
      }
      return LAC_GROUP_DEFAULT_QUANTITIES
    }

    return PRODUCT_SPECIFIC_QUANTITIES[productId] || ["0", "1", "2", "3", "4", "5"]
  }

  const handleDeviceChange = (device: string) => {
    setSelectedDevice(device)
  }

  const handleQuantityChange = (productId: string, quantity: string) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }))
  }

  const handleSubmit = async () => {
    if (!selectedDevice || selectedDevice === LAC_CONSOLIDATED_INVENTORY_DEVICE) return

    setIsSubmitting(true)
    setError(null)

    try {
      const products: ProductQuantity[] = Object.entries(productQuantities)
        .filter(([productId, quantity]) => {
          if (productId === PRODUCT_ID_OTROS) {
            return quantity.trim() !== ""
          }
          return quantity !== "" && quantity !== "0"
        })
        .map(([productId, quantity]) => ({ productId, quantity }))

      const inventory: CleaningInventory = {
        device: selectedDevice,
        products,
        reported_by: "Usuario MPDL",
        date: new Date().toISOString().split("T")[0],
      }

      console.log("Attempting to insert inventory:", JSON.stringify(inventory, null, 2))

      const { data, error: supabaseError } = await supabase.from("cleaning_inventories").insert([inventory]).select()

      if (supabaseError) {
        console.error("Error al guardar inventario en Supabase:", supabaseError)
        setError(`Error al guardar: ${supabaseError.message}`)
      } else {
        console.log("Inventory saved successfully:", data)
        setSuccess(true)
        setSelectedDevice("")
        setProductQuantities({})
        // Trigger PDF regeneration immediately after successful save
        console.log("Triggering PDF regeneration after successful save.")
        generateCleaningInventoryPdf().then((result) => {
          if (result.error) {
            console.error("Error regenerating PDF:", result.error)
          } else {
            console.log("PDF regenerated successfully.")
          }
        })
      }
    } catch (err) {
      console.error("Error inesperado al guardar inventario:", err)
      setError("Ocurrió un error inesperado al guardar el inventario.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">¡Inventario Guardado!</h2>
              <p className="text-gray-600 mb-6">
                El inventario de productos de limpieza ha sido registrado correctamente en el sistema MPDL.
              </p>
              <div className="space-y-2">
                <Button onClick={() => setSuccess(false)} className="mr-2">
                  Registrar Otro Inventario
                </Button>
                <Button variant="outline" onClick={onBack}>
                  Volver al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isLacConsolidated = selectedDevice === LAC_CONSOLIDATED_INVENTORY_DEVICE

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          {showBackButton && (
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
          <AppLogo size="small" className="mr-3" />
          <h1 className="text-2xl font-bold">Productos de Limpieza - MPDL</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registro de Inventario de Productos de Limpieza</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="device">Dispositivo</Label>
              <Select value={selectedDevice} onValueChange={handleDeviceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar dispositivo" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_OPTIONS.map((device) => (
                    <SelectItem key={device} value={device}>
                      {device === LAC_CONSOLIDATED_INVENTORY_DEVICE ? "LAC (Consolidado)" : device}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDevice && (
              <div className="space-y-4">
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    {isLacConsolidated
                      ? `Cantidades consolidadas para los dispositivos LAC1 a LAC6.`
                      : `Selecciona la cantidad disponible de cada producto para el dispositivo ${selectedDevice}`}
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CLEANING_PRODUCTS_LIST.map((product) => {
                    if (product.id === PRODUCT_ID_OTROS) {
                      return (
                        <div key={product.id} className="space-y-2">
                          <Label>{product.name}</Label>
                          <Input
                            type="text"
                            value={
                              isLacConsolidated ? "Ver detalles en sub-unidades" : productQuantities[product.id] || ""
                            }
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            placeholder="Especificar otros productos..."
                            readOnly={isLacConsolidated}
                            disabled={isLacConsolidated}
                          />
                        </div>
                      )
                    }

                    const quantityValue = isLacConsolidated
                      ? (lacSummaryQuantities[product.id] || 0).toString()
                      : productQuantities[product.id] || ""

                    return (
                      <div key={product.id} className="space-y-2">
                        <Label>{product.name}</Label>
                        {isLacConsolidated ? (
                          <Input type="text" value={quantityValue} readOnly disabled />
                        ) : (
                          <Select
                            value={quantityValue}
                            onValueChange={(value) => handleQuantityChange(product.id, value)}
                          >
                            <SelectTrigger className="w-1/2">
                              <SelectValue placeholder="Cantidad" />
                            </SelectTrigger>
                            <SelectContent>
                              {getQuantityOptions(product.id, selectedDevice).map((qty) => (
                                <SelectItem key={qty} value={qty}>
                                  {qty}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )
                  })}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isLacConsolidated || Object.keys(productQuantities).length === 0}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Guardando..." : "Guardar Inventario"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
