import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@solana/web3.js', '@solana/wallet-adapter-base'],
  },
};

export default nextConfig;
