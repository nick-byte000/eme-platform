import '../src/globals.css';
import 'katex/dist/katex.min.css';

export const metadata = {
  title: 'EME Student App',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
