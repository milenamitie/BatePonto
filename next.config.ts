import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.API_INTERNAL_URL || "http://localhost:3000"}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
