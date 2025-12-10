'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  forwardRef,
  ComponentPropsWithoutRef,
  useEffect,
  useRef,
} from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// Dialog Context
interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog provider');
  }
  return context;
}

// Dialog Root
interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;

  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <DialogContext.Provider value={{ open, setOpen, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

// Dialog Trigger
interface DialogTriggerProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, children, asChild, ...props }, ref) => {
    const { setOpen } = useDialogContext();

    if (asChild) {
      return (
        <span onClick={() => setOpen(true)} className="cursor-pointer">
          {children}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DialogTrigger.displayName = 'DialogTrigger';

// Dialog Portal (simplified - renders children in place)
interface DialogPortalProps {
  children: ReactNode;
}

export function DialogPortal({ children }: DialogPortalProps) {
  return <>{children}</>;
}

// Dialog Overlay
interface DialogOverlayProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
}

export const DialogOverlay = forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, ...props }, ref) => {
    const { open, setOpen } = useDialogContext();

    if (!open) return null;

    return (
      <div
        ref={ref}
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          className
        )}
        data-state={open ? 'open' : 'closed'}
        {...props}
      />
    );
  }
);
DialogOverlay.displayName = 'DialogOverlay';

// Dialog Content
interface DialogContentProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useDialogContext();
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };

      if (open) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        return () => {
          document.removeEventListener('keydown', handleEscape);
          document.body.style.overflow = '';
        };
      }
    }, [open, setOpen]);

    if (!open) return null;

    return (
      <>
        <DialogOverlay />
        <div
          ref={ref}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
            className
          )}
          data-state={open ? 'open' : 'closed'}
          {...props}
        >
          {children}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </>
    );
  }
);
DialogContent.displayName = 'DialogContent';

// Dialog Header
interface DialogHeaderProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
}

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5 text-center sm:text-left',
          className
        )}
        {...props}
      />
    );
  }
);
DialogHeader.displayName = 'DialogHeader';

// Dialog Footer
interface DialogFooterProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
}

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
          className
        )}
        {...props}
      />
    );
  }
);
DialogFooter.displayName = 'DialogFooter';

// Dialog Title
interface DialogTitleProps extends ComponentPropsWithoutRef<'h2'> {
  className?: string;
}

export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-none tracking-tight',
          className
        )}
        {...props}
      />
    );
  }
);
DialogTitle.displayName = 'DialogTitle';

// Dialog Description
interface DialogDescriptionProps extends ComponentPropsWithoutRef<'p'> {
  className?: string;
}

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
DialogDescription.displayName = 'DialogDescription';

// Dialog Close
interface DialogCloseProps extends ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, children, asChild, ...props }, ref) => {
    const { setOpen } = useDialogContext();

    if (asChild) {
      return (
        <span onClick={() => setOpen(false)} className="cursor-pointer">
          {children}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(false)}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DialogClose.displayName = 'DialogClose';
