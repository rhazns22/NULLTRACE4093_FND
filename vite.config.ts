import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/NULLTRACE4093_FND/" : "/",
  plugins: [react()],
});
