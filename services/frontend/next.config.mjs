/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },

  // output: 'export',  Loïc: I removed static export because 
  // src/app/api/download and src/app/api/proxy-download are dynamic and you
  // cannot "statically export" an API route that is inherently 
  // dynamic. 
}

export default nextConfig
