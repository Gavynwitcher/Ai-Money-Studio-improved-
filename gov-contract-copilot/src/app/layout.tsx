import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gov Contract Copilot',
  description: 'Gov Contract Copilot app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
