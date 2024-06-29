import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addExpense } from "../controllers/expense.controllers.js";

export const router = Router();

router.use(verifyJWT);

router.route("/add").post(addExpense);