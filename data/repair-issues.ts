// Problemas comunes de reparación y sus precios base
export const repairIssues = [
  {
    id: "screen",
    name: "Pantalla rota o con fallas",
    description: "Reemplazo de pantalla dañada, con líneas, manchas o que no responde al tacto",
    icon: "smartphone",
    basePrice: {
      low: 8000,
      medium: 15000,
      high: 35000,
      premium: 65000,
    },
  },
  {
    id: "battery",
    name: "Batería",
    description: "Reemplazo de batería con poca duración o que no carga correctamente",
    icon: "battery-medium",
    basePrice: {
      low: 3500,
      medium: 5000,
      high: 8000,
      premium: 12000,
    },
  },
  {
    id: "charging",
    name: "Puerto de carga",
    description: "Reparación o reemplazo del conector de carga dañado",
    icon: "plug-zap",
    basePrice: {
      low: 2500,
      medium: 3500,
      high: 4500,
      premium: 6000,
    },
  },
  {
    id: "camera",
    name: "Cámara",
    description: "Reparación o reemplazo de cámara frontal o trasera con fallas",
    icon: "camera",
    basePrice: {
      low: 3000,
      medium: 5500,
      high: 9000,
      premium: 18000,
    },
  },
  {
    id: "speaker",
    name: "Altavoz o micrófono",
    description: "Reparación de problemas de audio, altavoz o micrófono",
    icon: "volume-2",
    basePrice: {
      low: 2000,
      medium: 3000,
      high: 4500,
      premium: 6500,
    },
  },
  {
    id: "water",
    name: "Daño por agua",
    description: "Reparación de dispositivo con daños por líquidos",
    icon: "droplets",
    basePrice: {
      low: 4500,
      medium: 6500,
      high: 9000,
      premium: 15000,
    },
  },
  {
    id: "software",
    name: "Problemas de software",
    description: "Solución de problemas de sistema, actualizaciones o restauración",
    icon: "settings",
    basePrice: {
      low: 2000,
      medium: 2500,
      high: 3000,
      premium: 3500,
    },
  },
  {
    id: "buttons",
    name: "Botones físicos",
    description: "Reparación o reemplazo de botones de volumen, encendido o home",
    icon: "square",
    basePrice: {
      low: 2000,
      medium: 3000,
      high: 4000,
      premium: 5500,
    },
  },
]

// Categorías de precios por gama de dispositivo
export const deviceTiers = {
  apple: {
    "iphone-15-pro-max": "premium",
    "iphone-15-pro": "premium",
    "iphone-15-plus": "premium",
    "iphone-15": "premium",
    "iphone-14-pro-max": "premium",
    "iphone-14-pro": "premium",
    "iphone-14-plus": "high",
    "iphone-14": "high",
    "iphone-13-pro-max": "high",
    "iphone-13-pro": "high",
    "iphone-13": "high",
    "iphone-13-mini": "high",
    "iphone-12-pro-max": "high",
    "iphone-12-pro": "high",
    "iphone-12": "medium",
    "iphone-12-mini": "medium",
    "iphone-11-pro-max": "medium",
    "iphone-11-pro": "medium",
    "iphone-11": "medium",
    "iphone-se-2020": "medium",
    "iphone-xr": "medium",
    "iphone-xs-max": "medium",
    "iphone-xs": "medium",
    "iphone-x": "medium",
    "iphone-8-plus": "low",
    "iphone-8": "low",
  },
  samsung: {
    "galaxy-s23-ultra": "premium",
    "galaxy-s23-plus": "premium",
    "galaxy-s23": "premium",
    "galaxy-s22-ultra": "premium",
    "galaxy-s22-plus": "high",
    "galaxy-s22": "high",
    "galaxy-s21-ultra": "high",
    "galaxy-s21-plus": "high",
    "galaxy-s21": "high",
    "galaxy-s20-ultra": "high",
    "galaxy-s20-plus": "medium",
    "galaxy-s20": "medium",
    "galaxy-note-20-ultra": "high",
    "galaxy-note-20": "high",
    "galaxy-a54": "medium",
    "galaxy-a53": "medium",
    "galaxy-a52": "medium",
    "galaxy-a51": "medium",
    "galaxy-a34": "low",
    "galaxy-a33": "low",
    "galaxy-a23": "low",
    "galaxy-a13": "low",
  },
  // Definiciones para otras marcas...
  // Por defecto, si no está en la lista, se considera gama media
}

// Función para obtener el precio de reparación
export function getRepairPrice(brandId: string, modelId: string, issueId: string): number {
  // Obtener el problema
  const issue = repairIssues.find((i) => i.id === issueId)
  if (!issue) return 0

  // Determinar la gama del dispositivo
  let tier = "medium" // Por defecto gama media

  if (deviceTiers[brandId as keyof typeof deviceTiers]) {
    const brandTiers = deviceTiers[brandId as keyof typeof deviceTiers]
    if (brandTiers[modelId as keyof typeof brandTiers]) {
      tier = brandTiers[modelId as keyof typeof brandTiers]
    }
  }

  // Retornar el precio base según la gama
  return issue.basePrice[tier as keyof typeof issue.basePrice]
}
