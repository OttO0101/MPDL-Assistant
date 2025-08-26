"use client"

interface AppLogoProps {
  size?: "small" | "medium" | "large"
  className?: string
  variant?: "full" | "icon-only"
}

export function AppLogo({ size = "medium", className = "", variant = "full" }: AppLogoProps) {
  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-16 h-16",
    large: "w-20 h-20",
  }

  if (variant === "icon-only") {
    // Para casos donde solo queremos el ícono sin el fondo azul completo
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
        <img src="/mpdl-logo.png" alt="MPDL Logo" className="w-full h-full object-contain" />
      </div>
    )
  }

  // Versión completa con el logo original
  return (
    <div
      className={`${sizeClasses[size]} ${className} rounded-lg overflow-hidden flex items-center justify-center bg-white`}
    >
      <img src="/mpdl-logo.png" alt="MPDL - Movimiento por la Paz" className="w-full h-full object-contain" />
    </div>
  )
}
