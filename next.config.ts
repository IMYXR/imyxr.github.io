import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  return {
    // Static export: `npm run build` writes the whole site to ./out for GitHub Pages.
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    // The dev server keeps its cache apart from production builds. Otherwise running
    // `npm run build` while `npm run dev` is open wipes the files the dev server is
    // using and every page starts returning 500 until it is restarted.
    ...(phase === PHASE_DEVELOPMENT_SERVER ? { distDir: '.next-dev' } : {}),
  };
}
