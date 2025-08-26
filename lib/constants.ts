export const DEVICE_OPTIONS = [
  "CE",
  "CM",
  "CR",
  "EH",
  "GV2",
  "GV3",
  "GV4",
  "MF",
  "MM",
  "NG1",
  "NG2",
  "Oficina",
  "Academia",
  "LAC1",
  "LAC2",
  "LAC3",
  "LAC4",
  "LAC5",
  "LAC6",
  "LAC_Almacen",
  "LAC_CONSOLIDATED_INVENTORY", // Nuevo dispositivo consolidado
].sort()

export const LAC_CONSOLIDATED_INVENTORY_DEVICE = "LAC_CONSOLIDATED_INVENTORY"

const CLEANING_PRODUCT_NAMES_BASE = [
  "Lavavajillas",
  "Papel Cocina",
  "Bolsas Basura",
  "Friegasuelos",
  "Deterg. Vitro",
  "Quitagrasas",
  "Deterg. Lavadora",
  "Ambientador",
  "Bayetas",
  "Estropajos",
  "Lejía",
  "Limpiacristales",
  "Limp. Baño",
  "Otros",
]

export const CLEANING_PRODUCTS_LIST = CLEANING_PRODUCT_NAMES_BASE.map((name, index) => ({
  id: `cp${String(index + 1).padStart(3, "0")}`,
  name: name,
}))

export const PRODUCT_ID_OTROS =
  CLEANING_PRODUCTS_LIST.find((p) => p.name === "Otros")?.id ||
  `cp${String(CLEANING_PRODUCTS_LIST.length).padStart(3, "0")}`

export const PRODUCT_SPECIFIC_QUANTITIES: Record<string, string[]> = {
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Lavavajillas")?.id || "cp001"]: ["0", "1"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Papel Cocina")?.id || "cp002"]: ["0", "1", "2", "3"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Bolsas Basura")?.id || "cp003"]: ["0", "1", "2"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Friegasuelos")?.id || "cp004"]: ["0", "1"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Deterg. Vitro")?.id || "cp005"]: ["0", "1"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Quitagrasas")?.id || "cp006"]: ["0", "1"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Deterg. Lavadora")?.id || "cp007"]: ["0", "1", "2"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Ambientador")?.id || "cp008"]: ["0", "1", "2"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Bayetas")?.id || "cp009"]: ["0", "1"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Estropajos")?.id || "cp010"]: ["0", "1"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Lejía")?.id || "cp011"]: ["0", "1"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Limpiacristales")?.id || "cp012"]: ["0", "1"],
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Limp. Baño")?.id || "cp013"]: ["0", "1"],
}

export const LAC_SUB_UNITS_FOR_SUM = ["LAC1", "LAC2", "LAC3", "LAC4", "LAC5", "LAC6"]
export const PRODUCT_ID_PAPEL_COCINA = CLEANING_PRODUCTS_LIST.find((p) => p.name === "Papel Cocina")?.id
export const LAC_GROUP_DEFAULT_QUANTITIES = ["0", "1"]
export const LAC_PAPEL_COCINA_QUANTITIES = ["0", "1", "2"]

const MM_MF_QTY_0_1 = ["0", "1"]
const MM_MF_QTY_LAVAVAJILLAS = ["0", "1", "2"]
const MM_MF_QTY_PAPEL_COCINA = ["0", "1", "2", "3", "4"]
const MM_MF_QTY_BOLSAS_BASURA = ["0", "1", "2", "3"]
const MM_MF_QTY_FREGASUELOS = ["0", "1", "2"]
const MM_MF_QTY_DETERG_LAVADORA = ["0", "1", "2", "3"]

export const MM_MF_PRODUCT_QUANTITIES: Record<string, string[]> = {
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Quitagrasas")?.id || ""]: MM_MF_QTY_0_1,
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Deterg. Vitro")?.id || ""]: MM_MF_QTY_0_1,
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Bayetas")?.id || ""]: MM_MF_QTY_0_1,
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Estropajos")?.id || ""]: MM_MF_QTY_0_1,
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Lejía")?.id || ""]: MM_MF_QTY_0_1,
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Limpiacristales")?.id || ""]: MM_MF_QTY_0_1,
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Limp. Baño")?.id || ""]: MM_MF_QTY_0_1,
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Lavavajillas")?.id || ""]: MM_MF_QTY_LAVAVAJILLAS,
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Papel Cocina")?.id || ""]: MM_MF_QTY_PAPEL_COCINA,
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Bolsas Basura")?.id || ""]: MM_MF_QTY_BOLSAS_BASURA,
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Friegasuelos")?.id || ""]: MM_MF_QTY_FREGASUELOS,
  [CLEANING_PRODUCTS_LIST.find((p) => p.name === "Deterg. Lavadora")?.id || ""]: MM_MF_QTY_DETERG_LAVADORA,
}

// Limpiar claves vacías
for (const key in MM_MF_PRODUCT_QUANTITIES) {
  if (key === "") {
    delete MM_MF_PRODUCT_QUANTITIES[key]
  }
}
