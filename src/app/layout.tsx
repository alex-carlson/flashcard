// src/app/layout.tsx
import { ReactNode } from 'react';
import './globals.css'; // Add your global styles here

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Flashcards App</title>
      </head>
      <body>
        <div>{children}</div>
      </body>
    </html>
  );
}
