import type { Metadata } from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import './(default)/css/globals.css';
import { ToastProvider } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const fraunces = Fraunces({
  weight: ['600', '900'],
  subsets: ['latin'],
  variable: '--font-fraunces',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Whiskey Tasting',
  description: 'Log Whiskey Tasting entries for the night',
  applicationName: 'Whiskey Tasting',
  keywords: ['whiskey', 'tasting'],
  icons: { icon: '/logo.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className="h-full">
      <body
        className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable} antialiased min-h-full`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
