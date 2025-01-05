/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },

  typescript: {
    ignoreBuildErrors: true, // Disables type checking during the build process
  },
};

module.exports = nextConfig;
