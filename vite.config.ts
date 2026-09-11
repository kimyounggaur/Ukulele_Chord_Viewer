import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/Ukulele_Chord_Viewer/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        id: "/Ukulele_Chord_Viewer/",
        name: "우쿨렐레 코드 뷰어",
        short_name: "우쿨렐레 코드",
        description: "우쿨렐레 코드 운지와 소리를 한 화면에서",
        lang: "ko",
        theme_color: "#E8ECF3",
        background_color: "#E8ECF3",
        display: "standalone",
        orientation: "any",
        start_url: "/Ukulele_Chord_Viewer/",
        scope: "/Ukulele_Chord_Viewer/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2,json}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
});
