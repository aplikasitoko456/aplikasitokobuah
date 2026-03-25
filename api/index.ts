import app from "../src/server/app";

// Log status variabel lingkungan saat startup
if (!process.env.DATABASE_URL) {
  console.error("Vercel Startup: DATABASE_URL is NOT found!");
} else {
  console.log("Vercel Startup: DATABASE_URL is found (length: " + process.env.DATABASE_URL.length + ")");
}

// Ekspor aplikasi untuk Vercel Serverless Functions
export default app;
