'use client';

import { forwardRef, ComponentPropsWithoutRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

interface AvatarImageProps {
  className?: string;
  src?: string | null;
  alt?: string;
}

export const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt = '' }, ref) => {
    if (!src) return null;
    
    return (
      <Image
        ref={ref as React.Ref<HTMLImageElement>}
        src={src}
        alt={alt}
        fill
        sizes="40px"
        className={cn('aspect-square h-full w-full object-cover', className)}
        unoptimized={src.startsWith('data:') || src.startsWith('blob:')}
      />
    );
  }
);
AvatarImage.displayName = 'AvatarImage';

interface AvatarFallbackProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
}

export const AvatarFallback = forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AvatarFallback.displayName = 'AvatarFallback';
