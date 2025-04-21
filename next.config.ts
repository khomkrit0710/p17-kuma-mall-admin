import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9100",
        pathname: "/product-images/**",
      },
      {
        protocol: "https",
        hostname: "p17-minio.claraindustries.com",
        pathname: "/product-images/**",
      },
    ],
  },
};

export default nextConfig;
