import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Delhi CMO Grievance Portal',
  description:
    'Official Grievance Management System of the Chief Minister of Delhi. Submit, track and resolve civic complaints with full transparency.',
  keywords: ['Delhi', 'CMO', 'Grievance', 'Government', 'Complaints', 'Portal'],
  authors: [{ name: 'Delhi CMO' }],
  robots: 'noindex, nofollow', // Production: change to index, follow
  openGraph: {
    title: 'Delhi CMO Grievance Portal',
    description: 'Submit and track civic complaints with real-time updates.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
