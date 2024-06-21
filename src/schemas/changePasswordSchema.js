import { z } from "zod";

export const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(8, { message: "password were not less than 8 characters" }),

  newPassword: z
    .string({ message: "Why new password field is empty ?" })
    .min(8, { message: "password must be at least 8 characters" }),
});
