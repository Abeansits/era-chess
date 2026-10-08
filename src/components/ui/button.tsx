import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans text-sm font-medium tracking-wide transition disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brass)]',
  {
    variants: {
      variant: {
        brass: 'bg-[var(--brass)] text-[#1a140c] hover:bg-[var(--brass-2)]',
        ink: 'bg-[#1c1814] text-[var(--paper)] hover:bg-[#2a241c]',
        ghost: 'bg-transparent text-[var(--ink)] hover:bg-black/5',
        quiet: 'bg-transparent text-[var(--paper)] hover:bg-white/10',
        paper: 'bg-[var(--paper)] text-[var(--ink)] ring-1 ring-black/10 hover:bg-white',
      },
      size: {
        md: 'h-11 px-5',
        sm: 'h-9 px-3 text-xs',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'brass', size: 'md' },
  },
)

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
