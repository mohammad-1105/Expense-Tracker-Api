import mongoose, { Schema } from "mongoose";
import predefinedCategories from "./category.model.js";

const expenseSchema = new Schema(
  {
    category: {
      type: String,
      required: [true, "Category is required !"],
    },

    itemName: {
      type: String,
      required: [true, "Item name is required !"],
      maxlength: [50, "Item name cannot be more than 50 characters !"],
    },

    purchasedDate: {
      type: Date,
      default: Date.now,
      required: [true, "Purchased date is required !"],
    },

    amount: {
      type: Number,
      required: [true, "Amount is required !"],
      min: [0, "Amount cannot be negative !"],
    },

    description: {
      type: String,
      maxlength: [100, "Description cannot be more than 100 characters !"],
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const ExpenseModel = mongoose.model("Expense", expenseSchema);
export default ExpenseModel;
