import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DealerOps AI – Intelligent Dealership Operations Platform',
  description: 'Automated dealership operations management platform with AI agent workflows, inventory intelligence, service scheduling, and CRM follow-up.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}

