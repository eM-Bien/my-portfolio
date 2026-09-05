import type { Metadata } from 'next';
import './globals.scss';

export const metadata: Metadata = {
  title: 'Lorem Ipsum — portfolio',
  description: 'Placeholder. Do podmiany razem z fontami i tekstami.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
