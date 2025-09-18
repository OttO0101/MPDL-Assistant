"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function generateCleaningInventoryPdf(): Promise<Buffer> {
  try {
    console.log("🔄 Iniciando generación de PDF...")

    // Obtener todos los inventarios de la base de datos
    const { data: inventories, error } = await supabase
      .from("cleaning_inventories")
      .select("*")
      .order("device_name", { ascending: true })
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("❌ Error al obtener inventarios:", error)
      throw new Error(`Error al obtener datos: ${error.message}`)
    }

    console.log(`📊 Inventarios obtenidos: ${inventories?.length || 0}`)

    // Agrupar inventarios por dispositivo (tomar el más reciente de cada dispositivo)
    const latestInventories = new Map()
    inventories?.forEach((inventory) => {
      const deviceName = inventory.device_name
      if (!latestInventories.has(deviceName)) {
        latestInventories.set(deviceName, inventory)
      }
    })

    console.log(`🔧 Dispositivos únicos procesados: ${latestInventories.size}`)

    // Calcular LAC Consolidado
    const lacConsolidated = calculateLacConsolidated(Array.from(latestInventories.values()))

    // Generar HTML para el PDF
    const htmlContent = generatePdfHtml(Array.from(latestInventories.values()), lacConsolidated)

    // Simular generación de PDF (en un entorno real usarías puppeteer o similar)
    const pdfBuffer = Buffer.from(htmlContent, "utf-8")

    console.log("✅ PDF generado exitosamente")
    return pdfBuffer
  } catch (error) {
    console.error("❌ Error en generateCleaningInventoryPdf:", error)
    throw error
  }
}

function calculateLacConsolidated(inventories: any[]) {
  console.log("🧮 Calculando LAC Consolidado...")

  const lacDevices = inventories.filter((inv) => inv.device_name && inv.device_name.match(/^LAC[1-6]$/i))

  console.log(`📱 Dispositivos LAC encontrados: ${lacDevices.length}`)

  if (lacDevices.length === 0) {
    return null
  }

  const consolidated: any = {
    device_name: "LAC (Consolidado)",
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

function generatePdfHtml(inventories: any[], lacConsolidated: any): string {
  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Inventario de Productos de Limpieza - MPDL</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          color: #1e293b;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #004b87 0%, #00a3e0 100%);
          color: white;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 75, 135, 0.3);
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .date {
          text-align: center;
          margin-bottom: 30px;
          font-size: 14px;
          color: #64748b;
          background: white;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .device-section {
          margin-bottom: 40px;
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          border: 1px solid rgba(0, 163, 224, 0.1);
        }
        .device-header {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          padding: 20px;
          border-bottom: 2px solid #00a3e0;
        }
        .device-name {
          font-size: 20px;
          font-weight: bold;
          color: #004b87;
          margin: 0;
        }
        .device-date {
          font-size: 12px;
          color: #64748b;
          margin: 5px 0 0 0;
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          padding: 25px;
        }
        .product-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 10px;
          border-left: 4px solid #00a3e0;
          transition: all 0.3s ease;
        }
        .product-name {
          font-weight: 500;
          color: #334155;
          flex: 1;
        }
        .product-quantity {
          font-weight: bold;
          color: #004b87;
          background: white;
          padding: 5px 12px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .no-products {
          text-align: center;
          padding: 40px;
          color: #64748b;
          font-style: italic;
        }
        .consolidated-section {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
        }
        .consolidated-header {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }
        .consolidated-note {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin: 20px;
          font-size: 14px;
          color: #92400e;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          color: #64748b;
          font-size: 12px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Inventario de Productos de Limpieza</h1>
        <p>Movimiento por la Paz - Desarme y Democracia (MPDL)</p>
      </div>
      
      <div class="date">
        <strong>📅 Fecha de generación:</strong> ${currentDate}
      </div>
  `

  // Agregar inventarios regulares
  inventories.forEach((inventory) => {
    const deviceDate = inventory.updated_at
      ? new Date(inventory.updated_at).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Fecha no disponible"

    html += `
      <div class="device-section">
        <div class="device-header">
          <h2 class="device-name">🖥️ ${inventory.device_name || "Dispositivo sin nombre"}</h2>
          <p class="device-date">Última actualización: ${deviceDate}</p>
        </div>
    `

    if (inventory.products && typeof inventory.products === "object") {
      const products = Object.entries(inventory.products).filter(
        ([_, quantity]) => typeof quantity === "number" && quantity > 0,
      )

      if (products.length > 0) {
        html += '<div class="products-grid">'
        products.forEach(([productName, quantity]) => {
          html += `
            <div class="product-item">
              <span class="product-name">🧽 ${productName}</span>
              <span class="product-quantity">${quantity}</span>
            </div>
          `
        })
        html += "</div>"
      } else {
        html += '<div class="no-products">No hay productos registrados con cantidad mayor a 0</div>'
      }
    } else {
      html += '<div class="no-products">No hay productos registrados</div>'
    }

    html += "</div>"
  })

  // Agregar LAC Consolidado si existe
  if (lacConsolidated && Object.keys(lacConsolidated.products).length > 0) {
    html += `
      <div class="device-section consolidated-section">
        <div class="device-header consolidated-header">
          <h2 class="device-name">🏢 ${lacConsolidated.device_name}</h2>
          <p class="device-date">Consolidado generado: ${new Date(lacConsolidated.updated_at).toLocaleDateString(
            "es-ES",
            {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          )}</p>
        </div>
        <div class="consolidated-note">
          <strong>ℹ️ Nota:</strong> Este consolidado representa la suma total de las cantidades de productos 
          registradas en todos los dispositivos LAC1, LAC2, LAC3, LAC4, LAC5 y LAC6.
        </div>
    `

    const consolidatedProducts = Object.entries(lacConsolidated.products).filter(
      ([_, quantity]) => typeof quantity === "number" && quantity > 0,
    )

    if (consolidatedProducts.length > 0) {
      html += '<div class="products-grid">'
      consolidatedProducts.forEach(([productName, quantity]) => {
        html += `
          <div class="product-item">
            <span class="product-name">🧽 ${productName}</span>
            <span class="product-quantity">${quantity}</span>
          </div>
        `
      })
      html += "</div>"
    }

    html += "</div>"
  }

  html += `
      <div class="footer">
        <p><strong>Sistema de Inventarios MPDL</strong></p>
        <p>Generado automáticamente • Todos los datos son confidenciales</p>
      </div>
    </body>
    </html>
  `

  return html
}
