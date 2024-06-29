import { z } from "zod";
import predefinedCategories from "../models/category.model.js";

export const expenseSchema = z.object({
  category: z.enum(predefinedCategories),
  itemName: z
    .string({ message: "item name is required !" })
    .max(50, { message: "item name must be less than 50" }),
  amount: z
    .number({ message: "amount is required !" })
    .min(0, { message: "amount must be positive" }),
  description: z.string().optional(),
});
