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
    large: "w-24 h-24",
  }

  if (variant === "icon-only") {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center glow-effect rounded-xl`}>
        <img
          src="/mpdl-logo.png"
          alt="MPDL Logo"
          className="w-full h-full object-contain filter drop-shadow-lg transition-all duration-300 hover:drop-shadow-2xl hover:scale-105"
        />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} ${className} rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50 shadow-2xl border border-white/50 glow-effect transition-all duration-500 hover:scale-105 hover:shadow-3xl`}
    >
      <img
        src="/mpdl-logo.png"
        alt="MPDL - Movimiento por la Paz"
        className="w-full h-full object-contain p-2 filter drop-shadow-md transition-all duration-300"
      />
    </div>
  )
}
