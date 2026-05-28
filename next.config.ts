import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig = {
  serverExternalPackages: ['uploadthing'],
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "utfs.io",
      },
      {
        protocol: "https" as const,
        hostname: "**.ufs.sh",
      },
    ],
  },
};

export default withPWA(nextConfig);
