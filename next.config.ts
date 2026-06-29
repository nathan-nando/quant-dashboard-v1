import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow LAN devices (e.g. mobile phones on same network) to access dev server
  allowedDevOrigins: ["192.168.*.*"],
  sassOptions: {
    includePaths: [path.join(__dirname, "node_modules")],
  },
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
