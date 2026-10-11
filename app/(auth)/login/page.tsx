import { GalleryVerticalEnd } from 'lucide-react';
import { LoginForm } from '@/components/login-form';
import { Lora } from 'next/font/google';

const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
});

export default function LoginPage() {
  return (
    <div className={'grid min-h-svh lg:grid-cols-2 ' + lora.className}>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 flex flex-col justify-between bg-[#281b16] bg-[radial-gradient(circle_at_30%_20%,#b28a46,transparent_32%),linear-gradient(135deg,rgba(30,19,15,0.3),rgba(30,19,15,0.85))] p-13.75 text-[#f5ead3]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#d5b46a] bg-linear-to-br from-white/5 to-white/1 text-xl text-[#f4cf75]">
              Q
            </div>
            <div>
              <strong className="block tracking-[0.13em]">QUESTOS</strong>
              <small className="block font-sans text-[#a99583] text-[12px]">Turn goals into legends</small>
            </div>
          </div>

          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#f2c35f]">
              The Guild Begins Here
            </div>
            <h3 className="mt-2 text-5xl font-medium leading-tight">Every goal deserves a campaign.</h3>
            <p className="mt-4 font-sans leading-relaxed text-[#cdbdaa]">
              {/* Bangun ritme kerja, selesaikan milestone, dan abadikan pencapaian dalam satu sistem yang terasa hidup. */}
              Build your rhythm, accomplish milestones, and capture your achievements in a system that comes alive.
            </p>
          </div>

          <div className="flex gap-6 font-sans">
            {[
              { label: 'better completion', val: '86%' },
              { label: 'active quests', val: '24K' },
              { label: 'team rating', val: '4.9/5' },
            ].map((item) => (
              <div key={item.label}>
                <strong className="block text-2xl text-[#f2cf7e]">{item.val}</strong>
                <span className="text-[11px] uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-17.5 py-16 md:px-17.5 md:py-16 bg-[#f7efd2]">
        <div className="w-full h-full flex items-center justify-center">
          <LoginForm className="w-full min-w-125" />
        </div>
      </div>
    </div>
  );
}
