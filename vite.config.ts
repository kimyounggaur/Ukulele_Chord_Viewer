import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Ukulele_Chord_Viewer/",
  plugins: [react()],
});
