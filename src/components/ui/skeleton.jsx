import { cn } from "../../lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-card bg-neutral-200/80 dark:bg-neutral-800", className)}
      {...props}
    />
  )
}

export { Skeleton }
