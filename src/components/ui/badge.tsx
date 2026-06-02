import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        success:
          "border-[#9BD7A1] bg-[#EEF9F0] text-[#2F7A3E] [a&]:hover:bg-[#E5F5E8] dark:border-[#245A31] dark:bg-[#12261A] dark:text-[#9BD7A1] dark:[a&]:hover:bg-[#173120]",
        info:
          "border-[#9FCAE8] bg-[#EEF6FC] text-[#2E6E99] [a&]:hover:bg-[#E3F0FA] dark:border-[#2A5573] dark:bg-[#10202B] dark:text-[#9FCAE8] dark:[a&]:hover:bg-[#152B39]",
        warning:
          "border-[#F2C27A] bg-[#FFF5E8] text-[#A46110] [a&]:hover:bg-[#FDEED8] dark:border-[#6D4B1E] dark:bg-[#2A1D0F] dark:text-[#F2C27A] dark:[a&]:hover:bg-[#352514]",
        error:
          "border-[#F3A19B] bg-[#FFF0EE] text-[#C85A50] [a&]:hover:bg-[#FEE4E0] dark:border-[#6E3531] dark:bg-[#2C1715] dark:text-[#F3A19B] dark:[a&]:hover:bg-[#351C19]",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
