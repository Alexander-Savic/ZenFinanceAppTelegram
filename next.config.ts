import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Telegram's WebView embeds the app in an iframe-like context; make sure
  // no restrictive frame headers are ever added here (default Next.js config
  // doesn't set X-Frame-Options, but flagging so it stays that way).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;
