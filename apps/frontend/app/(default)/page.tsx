'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F0F0E8] flex justify-center items-center p-4 md:p-8">
      <div className="w-full max-w-4xl border border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-8 md:p-12 text-center">
        <h1 className="font-serif text-4xl md:text-6xl text-black tracking-tight leading-[0.95] mb-8">
          WHISKEY TASTING
        </h1>
        <p className="text-sm font-mono text-steel-grey uppercase tracking-wide mb-12 max-w-md mx-auto">
          {'// Have a drink!'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button
            onClick={() => router.push('/data-view')}
            className="h-24 font-mono text-lg uppercase tracking-wider bg-black text-white hover:bg-gray-800"
          >
            Data View
          </Button>
          <Button
            onClick={() => router.push('/tasting-submission')}
            className="h-24 font-mono text-lg uppercase tracking-wider bg-black text-white hover:bg-gray-800"
          >
            Tasting Submission
          </Button>
          <Button
            onClick={() => router.push('/administration')}
            className="h-24 font-mono text-lg uppercase tracking-wider bg-black text-white hover:bg-gray-800"
          >
            Administration
          </Button>
        </div>
      </div>
    </div>
  );
}
