import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { verify, reset } from "../constants.js";
import UserModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const sendEmail = async (email, emailType, userId) => {
  try {
    // create hashed token
    const hashedToken = uuidv4();
    if (emailType === verify) {
      await UserModel.findByIdAndUpdate(userId, {
        $set: {
          emailVerificationToken: hashedToken,
          emailVerificationTokenExpiry: new Date(Date.now() + 3600000), // 1 hour expiry
        },
      });
    } else if (emailType === reset) {
      await UserModel.findByIdAndUpdate(userId, {
        $set: {
          forgetPasswordToken: hashedToken,
          forgetPasswordTokenExpiry: new Date(Date.now() + 3600000), // 1 hour expiry
        },
      });
    }

    // create transporter object
    const transporter = nodemailer.createTransport({
      service: process.env.GMAIL_SERVICE,
      host: process.env.GMAIL_HOST,
      port: process.env.GMAIL_PORT,
      secure: process.env.GMAIL_SECURE,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // mail options
    const mailOptions = {
      from: "mohammad@ai.com",
      to: email,
      subject: emailType === verify ? "Email verification" : "Forgot password",
      html: `<p>Click <a href="${process.env.DOMAIN}/api/v1/users/${
        emailType === verify ? "verify-email" : "reset-password"
      }?token=${hashedToken}">here</a> to ${
        emailType === verify ? "verify your email" : "reset your password"
      }
        or copy and paste the link below in your browser. <br> ${
          process.env.DOMAIN
        }/api/v1/users/${
        emailType === verify ? "verify-email" : "reset-password"
      }?token=${hashedToken}
        </p>`,
    };

    // send mail
    const mailResponse = await transporter.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    throw new ApiError(500, "Failed to send verification email", []);
  }
};
