import app from "../src/server/app";
import path from "path";
import express from "express";

const PORT = 3000;

// Logika untuk pengembangan lokal (Local Development)
if (process.env.NODE_ENV !== "production") {
  const startDevServer = async () => {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  };
  startDevServer();
}

// Ekspor aplikasi untuk Vercel Serverless Functions
export default app;
