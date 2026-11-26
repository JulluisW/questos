import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded font-sans font-bold tracking-wider uppercase transition-all focus-visible:ring-2 focus-visible:ring-amber-700/50 focus-visible:ring-offset-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'border border-[#52372a] bg-[#3d271d] text-[#fbf8f3] shadow hover:bg-[#2b1b14] active:bg-[#1a0f0a]',
        secondary:
          'border border-[#d8ccbc] bg-[#f2ebdf] font-serif text-stone-800 normal-case tracking-normal shadow-sm hover:bg-[#eae1d2]',
        ghost: 'text-stone-600 hover:bg-[#f2ebdf] hover:text-[#1c120c]',
        danger: 'border border-red-900 bg-red-800 text-red-50 shadow hover:bg-red-900',
        oracle: 'border border-amber-700 bg-[#170e0a] text-amber-300 shadow hover:bg-[#2b1b14] hover:text-amber-200',
      },
      size: {
        sm: 'px-3 py-1.5 text-[10px]',
        md: 'px-4 py-2 text-xs',
        lg: 'px-5 py-3 text-xs',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
