import { z } from "zod";

export const updateFullNameSchema = z.object({
  fullName: z
    .string({ message: "why full name is empty ?" })
    .min(3, { message: "full name must be at least 3 characters" })
    .max(20, { message: "full name must be not more than 50 characters" })
    .regex(/^[a-zA-Z][a-zA-Z ]{2,49}$/, {
      message: "Full name is invalid",
    }),
});
