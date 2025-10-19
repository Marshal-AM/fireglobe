import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FireGlobe',
  description: 'On-chain agent testing framework',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script id="suppress-extension-errors" strategy="beforeInteractive">
          {`
            // Suppress Chrome extension errors
            const originalError = console.error;
            console.error = (...args) => {
              if (
                typeof args[0] === 'string' &&
                (args[0].includes('chrome.runtime.sendMessage') ||
                 args[0].includes('Extension ID'))
              ) {
                return;
              }
              originalError.apply(console, args);
            };
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
