/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // javascript-obfuscator runs fully in the browser; no Node core modules needed client-side.
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    return config;
  }
};

module.exports = nextConfig;
