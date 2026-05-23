import type { Metadata } from 'next';
import { JetBrains_Mono, Manrope } from 'next/font/google';
import { Providers } from '@/app/providers';
import { TooltipProvider } from '@/components/ui/tooltip';
import { sharedMetadata, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = sharedMetadata;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  inLanguage: 'es-PE',
  author: {
    '@type': 'Person',
    name: 'Elmer Jacobo',
    url: 'https://elmerjacobo.dev',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-PE"
      className={`${manrope.variable} ${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
