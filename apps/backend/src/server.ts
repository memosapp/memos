import app from "./app";
// import { backgroundEmbeddingService } from "./services/backgroundEmbeddingService"; // Disabled - using manual embedding generation
// import { closeDatabase } from "./config/database"; // Disabled - using Supabase now

const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Background embedding service disabled - using manual generation
  // backgroundEmbeddingService.start();
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");

  // Stop background services
  // backgroundEmbeddingService.stop(); // Disabled

  // Close server
  server.close(() => {
    console.log("HTTP server closed");
  });

  // Close database connections
  // await closeDatabase(); // Disabled - using Supabase now

  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");

  // Stop background services
  // backgroundEmbeddingService.stop(); // Disabled

  // Close server
  server.close(() => {
    console.log("HTTP server closed");
  });

  // Close database connections
  // await closeDatabase(); // Disabled - using Supabase now

  process.exit(0);
});

export default server;
