
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
// import { MainLayoutClient } from '@/components/layout/main-layout-client'; // Original static import
import { SessionProviderWrapper } from '@/components/auth/session-provider-wrapper';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'RetailManagement Store',
  description: 'Retail Management Store Application',
};

// Dynamically import MainLayoutClient
const DynamicMainLayoutClient = dynamic(() =>
  import('@/components/layout/main-layout-client').then((mod) => mod.MainLayoutClient),
  { 
    ssr: false, // Important as MainLayoutClient uses client-side hooks like usePathname
    loading: () => ( // Basic loading UI, can be customized
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <p>Loading application...</p>
      </div>
    )
  } 
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SessionProviderWrapper> {/* SessionProvider needs to wrap components using useSession */}
          <DynamicMainLayoutClient>
            {children}
          </DynamicMainLayoutClient>
          <Toaster />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
