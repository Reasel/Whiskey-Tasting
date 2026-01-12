import type { Metadata } from 'next';
import { Inter, Merriweather, JetBrains_Mono } from 'next/font/google';
import './(default)/css/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const merriweather = Merriweather({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-serif'
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: 'Whiskey Tasting',
  description: 'Log Whiskey Tasting entries for the night',
  applicationName: 'Whiskey Tasting',
  keywords: ['whiskey', 'tasting'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className="h-full">
      <body
        className={`${inter.variable} ${merriweather.variable} ${jetbrains.variable} antialiased min-h-full`}
      >
        {children}
      </body>
    </html>
  );
}
