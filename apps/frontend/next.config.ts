import type { NextConfig } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010';

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api_be/:path*',
        destination: `${API_URL}/:path*`,
      },
    ];
  },
  async headers() {
    // Prevent shared caches (Caddy/CDN) from serving a stale HTML document after a
    // deploy. Next.js defaults prerendered pages to `s-maxage=31536000`, so an old
    // document keeps pointing at chunk hashes the new build no longer ships, which
    // breaks the page until the cache expires. Hashed assets under /_next/static stay
    // immutable; only the HTML documents must always revalidate against the origin.
    return [
      {
        source: '/((?!_next/static|_next/image).*)',
        headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;
