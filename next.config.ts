import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ftp.goit.study',
        port: '',
        pathname: '/img/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/dj8oll68p/image/upload/**',
        search: '',
      },
    ],
  },
};

export default nextConfig;
