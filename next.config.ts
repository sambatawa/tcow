import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    FIREBASE_APIKEY: process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
    FIREBASE_AUTHDOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN,
    FIREBASE_PROJECTID: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
    FIREBASE_STORAGEBUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
    FIREBASE_MESSAGINGSENDERID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
    FIREBASE_APPID: process.env.NEXT_PUBLIC_FIREBASE_APPID,
  },
  async redirects() {
    return [
      {
        source: "/dashboard/environment",
        destination: "/dashboard/sensors",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
