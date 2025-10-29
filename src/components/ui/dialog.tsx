import { createContext } from "preact";
import type { ComponentChildren } from "preact";
import { createPortal } from "preact/compat";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import type { JSX } from "preact";
import { IconClose } from "@/components/icons";
import { cn } from "@/lib/utils";
import "./dialog.css";

type DialogContextValue = {
  close: () => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ComponentChildren;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const close = useMemo(
    () => () => onOpenChange?.(false),
    [onOpenChange]
  );

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <DialogContext.Provider value={{ close }}>
      <div className="dialog__overlay">{children}</div>
    </DialogContext.Provider>,
    document.body
  );
}

interface DialogContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  hideCloseButton?: boolean;
  children: ComponentChildren;
}

export function DialogContent({
  className,
  children,
  hideCloseButton = false,
  ...props
}: DialogContentProps) {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("DialogContent must be used within a Dialog");
  }

  return (
    <div className="dialog__backdrop" onClick={context.close}>
      <div
        className={cn("dialog__content", className)}
        onClick={(event) => event.stopPropagation()}
        {...props}
      >
        {!hideCloseButton && (
          <button
            type="button"
            className="dialog__close"
            onClick={context.close}
            aria-label="Close dialog"
          >
            <IconClose />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export const DialogTitle = ({
  className,
  ...props
}: JSX.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("dialog__title", className)} {...props} />
);
