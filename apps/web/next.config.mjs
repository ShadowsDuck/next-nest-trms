/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui'],
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
    // เพิ่ม limit สำหรับ request ที่ผ่าน middleware (proxy.ts) เพื่อรองรับอัปโหลดไฟล์ขนาดใหญ่
    proxyClientMaxBodySize: 30 * 1024 * 1024,
  },
}

export default nextConfig
