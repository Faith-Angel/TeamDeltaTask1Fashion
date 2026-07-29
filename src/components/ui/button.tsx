import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] min-w-[44px]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary',
        destructive: 'bg-error text-white hover:bg-error/90 focus-visible:ring-error',
        outline: 'border-2 border-primary bg-transparent text-primary hover:bg-muted focus-visible:ring-primary',
        secondary: 'bg-muted text-textPrimary hover:bg-border focus-visible:ring-primary',
        ghost: 'hover:bg-muted hover:text-primary focus-visible:ring-primary',
        link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-primary',
        accent: 'bg-accent text-textPrimary hover:bg-accent/90 focus-visible:ring-accent',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
