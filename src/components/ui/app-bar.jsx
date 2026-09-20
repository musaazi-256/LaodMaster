import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const appBarVariants = cva(
  "flex items-center gap-2 h-14 px-3 w-full transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "bg-white border-b border-neutral-200 text-neutral-900",
        transparent: "bg-transparent text-neutral-900",
        solid: "bg-neutral-900 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const AppBar = React.forwardRef(({ className, variant, ...props }, ref) => (
  <header
    ref={ref}
    className={cn(appBarVariants({ variant }), className)}
    {...props}
  />
))
AppBar.displayName = "AppBar"

const AppBarTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn("flex-1 text-h4 text-neutral-900 truncate font-semibold", className)}
    {...props}
  />
))
AppBarTitle.displayName = "AppBarTitle"

export { AppBar, AppBarTitle, appBarVariants }
