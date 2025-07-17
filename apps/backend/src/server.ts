import app from "./app";

const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");

  // Close server
  server.close(() => {
    console.log("HTTP server closed");
  });

  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");

  // Close server
  server.close(() => {
    console.log("HTTP server closed");
  });

  process.exit(0);
});

export default server;
