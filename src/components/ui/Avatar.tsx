import React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps {
  className?: string
  children?: React.ReactNode
}

interface AvatarImageProps {
  src: string
  alt?: string
  className?: string
}

interface AvatarFallbackProps {
  className?: string
  children?: React.ReactNode
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Avatar.displayName = "Avatar"

export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt, ...props }, ref) => {
    // Ne pas rendre l'image si src est vide ou null
    if (!src) {
      return null
    }
    
    return (
      <img
        ref={ref}
        className={cn("aspect-square h-full w-full", className)}
        src={src}
        alt={alt}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

export const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-700 text-sm font-medium",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
AvatarFallback.displayName = "AvatarFallback" 