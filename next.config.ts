import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage — replace <project-ref> with your actual project reference
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Supabase Storage (direct project URL)
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Ensure server-only packages are never bundled for the client
  serverExternalPackages: ["@prisma/client", "prisma"],

  experimental: {
    // Enable the Next.js 15 React compiler
    reactCompiler: false,
  },
};

export default nextConfig;
