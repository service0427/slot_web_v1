import * as React from "react"
import { toast as sonnerToast } from "sonner"

export interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  action?: React.ReactNode
}

export function toast({ title, description, variant = "default", action }: ToastProps) {
  if (variant === "destructive") {
    sonnerToast.error(title, {
      description,
      action,
    })
  } else {
    sonnerToast.success(title, {
      description,
      action,
    })
  }
}

export { toast as useToast }