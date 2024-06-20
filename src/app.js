import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

export const app = express();

// middlewares
app.use(express.static("public"));
app.use(express.json({ limit: "20kb"}));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());
app.use(cors({origin: process.env.CORS_ORIGIN, credentials: true}))
