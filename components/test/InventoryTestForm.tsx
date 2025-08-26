"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DEVICE_OPTIONS, CLEANING_PRODUCTS_LIST } from "@/lib/constants"
import { supabase } from "@/lib/supabase"

interface InventoryTestFormProps {
  onTestComplete: (success: boolean, message: string) => void
}

export default function InventoryTestForm({ onTestComplete }: InventoryTestFormProps) {
  const [selectedDevice, setSelectedDevice] = useState("")
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuantityChange = (productId: string, quantity: string) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }))
  }

  const handleSubmit = async () => {
    if (!selectedDevice) {
      onTestComplete(false, "Selecciona un dispositivo")
      return
    }

    setIsSubmitting(true)

    try {
      const products = Object.entries(quantities)
        .filter(([_, quantity]) => quantity && quantity !== "0")
        .map(([productId, quantity]) => ({ productId, quantity }))

      const testInventory = {
        device: selectedDevice,
        products,
        reported_by: "Prueba Manual MPDL",
        date: new Date().toISOString().split("T")[0],
      }

      const { data, error } = await supabase.from("cleaning_inventories").insert([testInventory]).select()

      if (error) throw error

      onTestComplete(true, `Inventario guardado exitosamente para ${selectedDevice}`)

      // Reset form
      setSelectedDevice("")
      setQuantities({})
    } catch (error: any) {
      onTestComplete(false, `Error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prueba Manual de Inventario MPDL</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Dispositivo</Label>
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar dispositivo" />
            </SelectTrigger>
            <SelectContent>
              {DEVICE_OPTIONS.slice(0, 5).map((device) => (
                <SelectItem key={device} value={device}>
                  {device}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDevice && (
          <div className="space-y-3">
            <Label>Productos (selecciona algunos para probar)</Label>
            {CLEANING_PRODUCTS_LIST.slice(0, 4).map((product) => (
              <div key={product.id} className="flex items-center space-x-3">
                <Label className="w-32">{product.name}</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={quantities[product.id] || ""}
                  onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                  className="w-20"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!selectedDevice || isSubmitting} className="w-full">
          {isSubmitting ? "Guardando..." : "Guardar Inventario de Prueba"}
        </Button>
      </CardContent>
    </Card>
  )
}
