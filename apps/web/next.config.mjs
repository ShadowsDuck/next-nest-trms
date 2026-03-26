/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui'],
  reactCompiler: true,
  cacheComponents: true,
}

export default nextConfig
