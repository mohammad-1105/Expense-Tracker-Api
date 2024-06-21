import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "express-compression";
import errorHandler from "../src/middlewares/errorHandler.middleware.js";

export const app = express();

// middlewares
app.use(express.static("public"));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(compression({ filter: shouldCompress }));

function shouldCompress(req, res) {
  if (req.headers["x-no-compression"]) {
    // don't compress responses with this request header
    return false;
  }
  // fallback to standard filter function
  return compression.filter(req, res);
}


// routes import 
import { router as userRouter } from "./routes/user.routes.js"

// routes declaration
app.use("/api/v1/users", userRouter)




// Custom JSON error handler middleware (define it after all routes)
app.use(errorHandler);
