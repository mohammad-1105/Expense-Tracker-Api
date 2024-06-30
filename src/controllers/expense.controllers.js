import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ExpenseModel from "../models/expense.model.js";
import { expenseSchema } from "../schemas/expenseSchema.js";
import { expenseSchemaPartial } from "../schemas/expenseSchemaPartial.js";

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

const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await ExpenseModel.find({ user: req.user._id });
  if (!expenses) throw new ApiError(404, "No expenses found", []);
  return res
    .status(200)
    .json(new ApiResponse(200, "Expenses fetched successfully", expenses));
});

const getExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expense = await ExpenseModel.findById(id);
  if (!expense) throw new ApiError(404, "Expense not found", []);
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense fetched successfully", expense));
});

const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const { success, error } = expenseSchemaPartial.safeParse(updateData);
  if (!success) throw new ApiError(400, error.issues[0].message, []);

  const updatedExpense = await ExpenseModel.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Expense updated successfully", updatedExpense));
});

const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedExpense = await ExpenseModel.findByIdAndDelete(id);
  if (!deletedExpense) throw new ApiError(404, "Expense not found", []);
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense deleted successfully", deletedExpense));
});


// exports controllers
export {
  addExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
};
