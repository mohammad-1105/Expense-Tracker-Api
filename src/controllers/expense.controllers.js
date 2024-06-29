import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ExpenseModel from "../models/expense.model.js";
import { expenseSchema } from "../schemas/expenseSchema.js";

const addExpense = asyncHandler(async (req, res) => {
  // get data from request body
  const { category, itemName, amount, description } = req.body;

  // validation with zod
  const { success, error } = expenseSchema.safeParse({
    category,
    itemName,
    amount,
    description,
  });
  if (!success) throw new ApiError(400, error.issues[0].message, []);

  // create new expense
  const newExpense = await ExpenseModel.create({
    category,
    itemName,
    amount,
    description,
    user: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Expense created successfully", newExpense));
});

// exports controllers
export { addExpense };
