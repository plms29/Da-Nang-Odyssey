import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal server bundle for the Cloud Run container (Dockerfile copies .next/standalone).
  output: "standalone",
};

export default nextConfig;
