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
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="py-4 bg-yellow-500 text-black">
            <div className="container mx-auto text-center">
              <h1 className="text-2xl font-bold">Prost Free Beer Generator</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex justify-center items-center">
            <div className="w-full max-w-4xl">{children}</div>
          </main>

          {/* Footer */}
          <footer className="bg-yellow-500 text-black py-4 fixed bottom-0 w-full">            <div className="container mx-auto text-center">
            <p className="text-sm">&copy; 2025 Almost Playable Games. All Rights Reserved.</p>
          </div>
          </footer>
        </div>
      </body>
    </html>
  );
}