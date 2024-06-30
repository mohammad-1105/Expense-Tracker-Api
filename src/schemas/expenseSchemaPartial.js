import { z } from "zod";
import predefinedCategories from "../models/category.model.js";

export const expenseSchemaPartial = z.object({
  category: z.enum(predefinedCategories).optional(),
  itemName: z.string().optional(),
  amount: z.number().optional(),
  description: z.string().optional(),
});
