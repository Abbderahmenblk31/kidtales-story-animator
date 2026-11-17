/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    serverComponentsExternalPackages: ["@ffmpeg-installer/ffmpeg"],
  },
};

export default nextConfig;
