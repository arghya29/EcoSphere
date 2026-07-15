'use client';

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>404 - Page Not Found</h1>
            <p>The page you are looking for does not exist.</p>
            <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>Go Home</a>
          </div>
        </div>
      </body>
    </html>
  );
}
