import '../src/globals.css';
import 'katex/dist/katex.min.css';

export const metadata = {
  title: 'GOKOO',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
