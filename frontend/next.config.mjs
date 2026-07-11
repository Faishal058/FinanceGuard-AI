/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // These packages use native binaries or filesystem deps that CANNOT be bundled by webpack.
  // They must be treated as external so Node.js loads them natively in the serverless runtime.
  serverExternalPackages: [
    'pdf-parse',
    'ioredis',
    '@mastra/core',
    '@libsql/client',
    'bcryptjs',
    'jsonwebtoken',
  ],
}

export default nextConfig

