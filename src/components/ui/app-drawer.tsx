import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from "./sheet"

export {
  Sheet,
  SheetClose,
  SheetTrigger,
  SheetPortal,
  SheetOverlay,
  SheetTitle,
  SheetDescription,
}

// Standardized side-drawer content: hides the default top-right close button
// (rendered by SheetContent) since DrawerHeader renders its own, positioned
// inline with the title and any header actions.
export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof SheetContent>,
  React.ComponentPropsWithoutRef<typeof SheetContent>
>(({ className, ...props }, ref) => (
  <SheetContent
    ref={ref}
    side="right"
    className={cn(
      "w-full sm:max-w-md bg-card border-l border-border/20 p-0 flex flex-col overflow-y-auto [&>button]:hidden",
      className,
    )}
    {...props}
  />
))
DrawerContent.displayName = "DrawerContent"

interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Called when the header close 'X' is clicked. Omit to hide it (e.g. forced flows). */
  onClose?: () => void
  /** Extra header action buttons, rendered with spacing before the close 'X'. */
  actions?: React.ReactNode
}

export function DrawerHeader({ onClose, actions, className, children, ...props }: DrawerHeaderProps) {
  return (
    <SheetHeader className={cn("px-6 pt-6 pb-4 text-left space-y-0", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">{children}</div>
        {(actions || onClose) && (
          <div className="flex items-center gap-1.5 shrink-0 -mr-1.5 -mt-1.5">
            {actions}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </SheetHeader>
  )
}

export const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <SheetFooter
    className={cn(
      "p-6 border-t border-border/10 mt-auto sticky bottom-0 z-10 bg-card flex flex-row gap-3 sm:space-x-0",
      className,
    )}
    {...props}
  />
)
