import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const sidebarVariants = cva(
  "flex h-full flex-col border-r bg-white text-neutral-900 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-neutral-200",
        ghost: "border-transparent",
      },
      size: {
        default: "w-60",
        sm: "w-48",
        lg: "w-72",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Sidebar = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn(sidebarVariants({ variant, size }), className)}
    {...props}
  />
))
Sidebar.displayName = "Sidebar"

const sidebarItemVariants = cva(
  "flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-body-sm transition-colors duration-fast font-medium",
  {
    variants: {
      active: {
        true: "bg-green-50 text-green-700 font-semibold",
        false: "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
)

const SidebarItem = React.forwardRef(({ className, active, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(sidebarItemVariants({ active }), className)}
    {...props}
  />
))
SidebarItem.displayName = "SidebarItem"

export { Sidebar, SidebarItem, sidebarVariants, sidebarItemVariants }
