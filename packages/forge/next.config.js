const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
  reactStrictMode: true,
  transpilePackages: ['@internal/document-editor'],
};
module.exports = nextConfig
  