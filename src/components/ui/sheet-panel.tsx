"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { SheetSize } from "@/components/ui/sheet"

/**
 * The one way to build a side panel in this app.
 *
 * Structure is fixed: a header that stays visible, a body that is the only
 * scrollable area, and a footer for the primary actions. Callers compose the
 * slots and never re-implement scrolling, padding or stickiness, which is what
 * kept the four panels inconsistent before.
 */
function SheetPanel({
  size = "xl",
  className,
  children,
  ...props
}: React.ComponentProps<typeof SheetContent> & { size?: SheetSize }) {
  return (
    <SheetContent
      side="right"
      size={size}
      className={cn("gap-0 p-0", className)}
      {...props}
    >
      {children}
    </SheetContent>
  )
}

function SheetPanelHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <SheetHeader
      data-slot="sheet-panel-header"
      className={cn(
        "sticky top-0 z-10 shrink-0 gap-1.5 border-b bg-background/95 px-5 py-4 pr-12 backdrop-blur",
        className
      )}
      {...props}
    />
  )
}

function SheetPanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-panel-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm",
        className
      )}
      {...props}
    />
  )
}

function SheetPanelFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <SheetFooter
      data-slot="sheet-panel-footer"
      className={cn(
        "sticky bottom-0 z-10 mt-0 shrink-0 gap-2 border-t bg-background/95 p-4 backdrop-blur",
        className
      )}
      {...props}
    />
  )
}

function SheetPanelSection({
  title,
  description,
  className,
  children,
}: {
  title: string
  description?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      data-slot="sheet-panel-section"
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export {
  SheetPanel,
  SheetPanelHeader,
  SheetPanelBody,
  SheetPanelFooter,
  SheetPanelSection,
  SheetTitle,
  SheetDescription,
}
