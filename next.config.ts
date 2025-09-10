import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dwylojmkbggcdvus.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    // Do not block builds on ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
