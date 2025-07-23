import express, { Express } from "express";
import cors from "cors";

// Import routes
import healthRouter from "./routes/health";
import memoRouter from "./routes/memos";
import searchRouter from "./routes/search";
import authRouter from "./routes/auth";
import aiRouter from "./routes/ai";
import performanceRouter from "./routes/performance";
import apiKeysRouter from "./routes/apiKeys";
import pdfRouter from "./routes/pdf";

// Create Express app
const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/", healthRouter);
app.use("/", memoRouter);
app.use("/", searchRouter);
app.use("/auth", authRouter);
app.use("/", aiRouter);
app.use("/", performanceRouter);
app.use("/api-keys", apiKeysRouter);
app.use("/", pdfRouter);

export default app;
