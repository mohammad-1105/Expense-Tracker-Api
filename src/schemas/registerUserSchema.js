import { z } from "zod";

export const registerUserSchema = z.object({
  username: z
    .string({ message: "why username is empty ?" })
    .min(3, { message: "username must be at least 3 characters" })
    .max(20, { message: "username must be not more than 20 characters" })
    .trim()
    .regex(/^[a-zA-Z][a-zA-Z0-9_]{2,29}$/, {
      message: "Username is invalid",
    }),

  fullName: z
    .string({ message: "why full name is empty ?" })
    .min(3, { message: "full name must be at least 3 characters" })
    .max(20, { message: "full name must be not more than 50 characters" })
    .regex(/^[a-zA-Z][a-zA-Z ]{2,49}$/, {
      message: "Full name is invalid",
    }),

  email: z.string({ message: "Why email is empty ?" }).email(),
  password: z
    .string({ message: "Why password is empty ?" })
    .min(8, { message: "password must be at least 8 characters" }),
});
