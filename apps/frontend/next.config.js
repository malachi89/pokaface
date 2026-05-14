/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@pokaface/shared'],
}

module.exports = nextConfig
