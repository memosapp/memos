import express, { Express } from "express";
import cors from "cors";

// Import routes
import healthRouter from "./routes/health";
import memoRouter from "./routes/memos";
import searchRouter from "./routes/search";
import authRouter from "./routes/auth";

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

export default app;
