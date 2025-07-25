import app from "./app";

// Environment-specific configuration
const NODE_ENV = process.env.NODE_ENV || "production";
const isDevelopment = NODE_ENV === "development";

// Port configuration
const PORT = parseInt(
  process.env.PORT || (isDevelopment ? "8080" : "3001"),
  10
);

// Host configuration
const HOST = process.env.HOST || (isDevelopment ? "0.0.0.0" : "0.0.0.0");

console.log(`Environment: ${NODE_ENV}`);
console.log(`Host: ${HOST}`);
console.log(`Port: ${PORT}`);

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST}:${PORT} (${NODE_ENV})`);
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
