'use client';

import { forwardRef, ComponentPropsWithoutRef, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ScrollAreaProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
  viewportClassName?: string;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, viewportClassName, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent',
            viewportClassName
          )}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'hsl(var(--border)) transparent',
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);
ScrollArea.displayName = 'ScrollArea';

interface ScrollBarProps extends ComponentPropsWithoutRef<'div'> {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const ScrollBar = forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ className, orientation = 'vertical', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex touch-none select-none transition-colors',
          orientation === 'vertical' &&
            'h-full w-2.5 border-l border-l-transparent p-[1px]',
          orientation === 'horizontal' &&
            'h-2.5 flex-col border-t border-t-transparent p-[1px]',
          className
        )}
        {...props}
      >
        <div className="relative flex-1 rounded-full bg-border" />
      </div>
    );
  }
);
ScrollBar.displayName = 'ScrollBar';
