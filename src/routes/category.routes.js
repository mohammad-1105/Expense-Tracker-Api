import { Router } from "express";
import { getCategories } from "../controllers/category.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

export const router = Router();

router.route("/").get(verifyJWT, getCategories);
