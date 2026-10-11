import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { Lora } from 'next/font/google';

const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
});

export function LoginForm({ className, ...props }: React.ComponentProps<'form'>) {
  return (
    <form
      className={cn(
        'w-full h-full flex flex-col justify-center bg-[#f7efd2] p-16 text-[#201711] rounded-2xl',
        className,
      )}
      {...props}
    >
      <div className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#8f251d]">Tavern Gate</div>
      <h3 className="mt-2 text-4xl font-medium">Welcome back, Architect</h3>
      <p className="mt-2 mb-8 font-sans text-[#776758] text-sm">
        Masuk untuk melanjutkan campaign dan melihat progress tim.
      </p>

      <FieldGroup className="grid gap-4">
        <Field className="grid gap-2">
          <FieldLabel className="font-sans text-[11px] font-bold uppercase tracking-[0.12em]">EMAIL</FieldLabel>
          <Input
            className="h-12 w-full rounded-xl border border-[#bda77b] bg-white/40 px-4 focus:outline-none focus:ring-2 focus:ring-[#c99118]/50"
            placeholder="you@company.com"
          />
        </Field>

        <Field className="grid gap-2">
          <FieldLabel className="font-sans text-[11px] font-bold uppercase tracking-[0.12em]">PASSWORD</FieldLabel>
          <Input
            type="password"
            className="h-12 w-full rounded-xl border border-[#bda77b] bg-white/40 px-4"
            defaultValue="password123"
          />
        </Field>

        <Field>
          <Button className="mt-4 w-full rounded-xl bg-linear-to-br from-[#6c3d2f] to-[#3f2a22] py-3 font-bold text-[#fff7e8] tracking-[0.03em] hover:opacity-90 transition-opacity">
            SIGN IN TO QUESTOS
          </Button>
        </Field>
      </FieldGroup>

      <FieldSeparator className="my-6 flex items-center gap-3 text-[11px] text-[#8c7b6a] before:h-px before:flex-1 before:bg-[#c7b690] after:h-px after:flex-1 after:bg-[#c7b690]">
        atau lanjutkan dengan
      </FieldSeparator>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="rounded-xl border border-[#987d59] py-3 font-bold text-[#4c3529] hover:bg-[#c7b690]/20 transition-colors"
        >
          G Google
        </Button>
        <Button
          variant="outline"
          className="rounded-xl border border-[#987d59] py-3 font-bold text-[#4c3529] hover:bg-[#c7b690]/20 transition-colors"
        >
          ▣ Microsoft
        </Button>
      </div>
    </form>
  );
}
