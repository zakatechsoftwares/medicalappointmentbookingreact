import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Older phones and in-app browsers that can't run modern JavaScript get a
    // separate compatible bundle. Modern browsers never download it.
    legacy({
      targets: ["defaults", "Android >= 5", "iOS >= 11", "Chrome >= 49", "Samsung >= 5", "UCAndroid >= 12"],
    }),
  ],
});
