import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addExpense,
  deleteExpense,
  getExpense,
  getExpenses,
  updateExpense,
} from "../controllers/expense.controllers.js";

export const router = Router();

router.use(verifyJWT);

router.route("/add-expense").post(addExpense);
router.route("/all").get(getExpenses);
router.route("/:id").get(getExpense).patch(updateExpense);
router.route("/delete/:id").delete(deleteExpense);
