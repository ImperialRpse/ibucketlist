import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Static export requires unoptimized images
  },
};

export default nextConfig;
