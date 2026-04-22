/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  async redirects() {
    return [
      // Former home of the cross-specialty lookup → now /vetmed
      { source: '/medications/lookup', destination: '/vetmed', permanent: true },
      // Derm wiki moved under /wiki in the hub restructure
      { source: '/conditions/:path*', destination: '/wiki/conditions/:path*', permanent: true },
      { source: '/medications/:path*', destination: '/wiki/medications/:path*', permanent: true },
      // /search is now the cross-tool hub search; the wiki-scoped search lives at /wiki/search
    ]
  },
}

module.exports = nextConfig
