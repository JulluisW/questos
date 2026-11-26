'use client';

import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';

type SubmitButtonProps = Omit<ButtonProps, 'type'> & {
  pendingLabel?: React.ReactNode;
};

/**
 * Submit button that disables itself while its parent <form> action runs.
 * When several submit buttons share a form, only the one that was clicked
 * shows `pendingLabel` (matched by name/value of the submitter).
 */
export function SubmitButton({
  children,
  className,
  variant,
  size,
  pendingLabel = 'Working…',
  disabled,
  name,
  value,
  ...props
}: SubmitButtonProps) {
  const { pending, data } = useFormStatus();
  const isSubmitter = name ? data?.get(name) === value : true;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending || disabled}
      aria-busy={pending && isSubmitter}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {pending && isSubmitter ? <span className="animate-pulse">{pendingLabel}</span> : children}
    </button>
  );
}
