import '../src/globals.css';
import 'katex/dist/katex.min.css';

export const metadata = {
  title: 'EME Admin Panel',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}