// Libs
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to ALL API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          // Allow your Dashboard (3001) and AR App (5173) to connect
          { key: "Access-Control-Allow-Origin", value: process.env.NODE_ENV === "production" ? "https://occlusion-backend.vercel.app" : "http://localhost:3001" }, // We will handle the AR app origin dynamically in a real environment, but Next requires a single string here or dynamic handling via middleware. For local testing, Dashboard is priority.
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  }
};

export default nextConfig;
