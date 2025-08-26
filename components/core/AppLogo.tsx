import { cn } from "@/lib/utils"

interface AppLogoProps {
  size?: "small" | "medium" | "large"
  className?: string
}

export function AppLogo({ size = "medium", className }: AppLogoProps) {
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img src="/mpdl-logo.png" alt="MPDL Logo" className={cn("object-contain", sizeClasses[size])} />
    </div>
  )
}
