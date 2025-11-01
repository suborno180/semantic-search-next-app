import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Semantic Search Engine',
  description: 'Local semantic search with TensorFlow.js and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}