import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'PredictX - 예측 마켓',
  description: 'BTC, ETH, KOSPI 가격 예측으로 수익을 창출하세요',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D0D0D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="bg-linear-bg-primary text-linear-text-primary">
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1F1F1F',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 500,
                border: '1px solid #2A2A2A',
              },
              success: {
                iconTheme: {
                  primary: '#30D158',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#FF453A',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
