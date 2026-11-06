import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "foscdnhzmpuvtydqvkmz.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
