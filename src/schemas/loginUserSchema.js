import { z } from "zod";

export const loginUserSchema = z
  .object({
    username: z.string().optional(),
    email: z.string().email().optional(),
    password: z
      .string({ message: "Why password is empty?" })
      .min(8, { message: "Password must be at least 8 characters" }),
  })
  .refine((data) => data.username || data.email, {
    message: "Either username or email is required",
    path: ["username", "email"], // Set the path for the error
  });
