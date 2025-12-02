"use client";

import * as React from 'react';

import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & {
    requiredIndicator?: boolean;
  }
>(({ className, children, requiredIndicator, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
    {...props}
  >
    {children}
    {requiredIndicator ? <span className="text-destructive">*</span> : null}
  </label>
));
Label.displayName = 'Label';

export { Label };






