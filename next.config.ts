// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cette configuration renvoie tout ce qui commence par /api vers votre backend Python */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://apiti.onrender.com/api/:path*', 
      },
    ];
  },
};

export default nextConfig;