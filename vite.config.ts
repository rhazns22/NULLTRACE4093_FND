import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isVercel = process.env.VERCEL === "1";

  return {
    base: isVercel
      ? "/"
      : mode === "production"
        ? "/NULLTRACE4093_FND/"
        : "/",
    plugins: [react()],
  };
});
