import '@/styles/globals.css';

export const metadata = {
  title: 'Xeno Shopify Insights',
  description: 'Multi-tenant Shopify Data Ingestion & Insights Service',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
