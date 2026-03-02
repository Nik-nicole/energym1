const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  experimental: {
    outputFileTracingRoot: path.join(__dirname),
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  // 🔥 CONFIGURACIÓN CRÍTICA PARA PRODUCCIÓN
  // Forzar comportamiento dinámico para evitar SSG en páginas con datos dinámicos
  output: 'standalone',
  swcMinify: true,
  // Evitar problemas de serialización
  reactStrictMode: true,
};

module.exports = nextConfig;
