'use client';

import { forwardRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  disabled?: boolean;
  className?: string;
}

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value: controlledValue,
      defaultValue = [0],
      min = 0,
      max = 100,
      step = 1,
      onValueChange,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = controlledValue ?? internalValue;

    const percentage = ((value[0] - min) / (max - min)) * 100;

    const handleChange = useCallback(
      (newValue: number) => {
        const clampedValue = Math.max(min, Math.min(max, newValue));
        const steppedValue = Math.round(clampedValue / step) * step;
        const newValues = [steppedValue];

        if (controlledValue === undefined) {
          setInternalValue(newValues);
        }
        onValueChange?.(newValues);
      },
      [min, max, step, controlledValue, onValueChange]
    );

    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newValue = min + clickPosition * (max - min);
      handleChange(newValue);
    };

    const handleDrag = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;

        const track = e.currentTarget.closest('[data-slider-track]');
        if (!track) return;

        const rect = track.getBoundingClientRect();

        const onMouseMove = (moveEvent: MouseEvent) => {
          const position = (moveEvent.clientX - rect.left) / rect.width;
          const newValue = min + Math.max(0, Math.min(1, position)) * (max - min);
          handleChange(newValue);
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      },
      [disabled, min, max, handleChange]
    );

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        <div
          data-slider-track
          onClick={handleTrackClick}
          className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary cursor-pointer"
        >
          <div
            className="absolute h-full bg-primary"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value[0]}
          tabIndex={disabled ? -1 : 0}
          onMouseDown={handleDrag}
          className={cn(
            'absolute block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            disabled && 'cursor-not-allowed'
          )}
          style={{
            left: `calc(${percentage}% - 10px)`,
          }}
        />
      </div>
    );
  }
);
Slider.displayName = 'Slider';
