import { asyncHandler } from "../utils/AsyncHandler.js";
import UserModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  emailSchema,
  registerUserSchema,
} from "../schemas/registerUserSchema.js";
import { loginUserSchema } from "../schemas/loginUserSchema.js";
import {
  changePasswordSchema,
  newPassowrdSchema,
} from "../schemas/changePasswordSchema.js";
import { updateFullNameSchema } from "../schemas/updateFullNameSchema.js";
import { sendEmail } from "../utils/mail.js";
import { reset, verify } from "../constants.js";

// Global functions
const generateAccessAndRefreshAccessTokens = async (userId) => {
  // find user by Id
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error(404, "User not found, can't generates tokens", []);
  }

  // generate tokens
  const accessToken = user.generateAccessToken();
  const refreshAccessToken = user.generateRefreshAccessToken();

  // save refreshAccessToken to db
  user.refreshAccessToken = refreshAccessToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshAccessToken };
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

// Define controllers
const registerUser = asyncHandler(async (req, res) => {
  // get data from request body
  const { username, fullName, email, password } = req.body;

  // validation with zod
  const { success, error } = registerUserSchema.safeParse({
    username,
    fullName,
    email,
    password,
  });
  if (!success) {
    throw new ApiError(400, error.issues[0].message, []);
  }

  // check if the user already exists
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists", []);
  }

  // create new user
  const newUser = new UserModel({
    username,
    fullName,
    email,
    password,
    isEmailVerified: false,
  });

  // save the user to db
  await newUser.save({ validateBeforeSave: false });

  // send Email
  await sendEmail(newUser.email, verify, newUser._id);

  // get the user
  const user = await UserModel.findById(newUser._id).select(
    "-password -refreshAccessToken"
  );
  if (!user) {
    throw new Error(500, "Something went wrong while registering the user", []);
  }

  // send response
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "User registered successfully. Please verify your email.",
        user
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from the request body
  const { username, email, password } = req.body;

  // validation with zod
  const { success, error } = loginUserSchema.safeParse({
    username,
    email,
    password,
  });

  if (!success) {
    throw new ApiError(400, error.issues[0].message, []);
  }

  // check if the user doesn't exists
  const user = await UserModel.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "User not found", []);
  }

  // check if the password is correct
  const isPasswordMatched = await user.isPasswordMatched(password);
  if (!isPasswordMatched) {
    throw new ApiError(401, "Invalid credentials", []);
  }

  // generates tokens
  const { accessToken, refreshAccessToken } =
    await generateAccessAndRefreshAccessTokens(user._id);

  const loggedInUser = {
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshAccessToken", refreshAccessToken, cookieOptions)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        loggedInUser,
        accessToken,
        refreshAccessToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Ensure user is authenticated and available in req.user
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized access", []);
  }

  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      refreshAccessToken: null, // Clear the refresh access token
    },
    {
      new: true, // Return the updated document
    }
  );
  if (!user) {
    throw new Error(404, "User not found", []);
  }

  // clear cookies from the browser and send response
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshAccessToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully", []));
});

const refreshTokens = asyncHandler(async (req, res) => {
  // Ensure user is authenticated and available in req.user
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized access", []);
  }

  // Generate new access and refresh tokens
  const { accessToken, refreshAccessToken } =
    await generateAccessAndRefreshAccessTokens(req.user._id);

  // Send response with new access and refresh tokens
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshAccessToken", refreshAccessToken, cookieOptions)
    .json(
      new ApiResponse(200, "Tokens refreshed successfully", {
        accessToken,
        refreshAccessToken,
      })
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
  // Ensure user is authenticated and available in req.user
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized access", []);
  }

  // Find user
  const user = await UserModel.findById(req.user._id).select(
    "-password -refreshAccessToken -forgetPasswordToken -forgetPasswordTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry"
  );
  if (!user) {
    throw new Error(404, "User not found", []);
  }

  // return response
  return res
    .status(200)
    .json(new ApiResponse(200, "User profile fetched successfully", user));
});

const updateUserFullName = asyncHandler(async (req, res) => {
  // Ensure user is authenticated and available in req.user
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized access", []);
  }

  // get FullName from request
  const { fullName } = req.body;

  // validation with zod
  const { success, error } = updateFullNameSchema.safeParse({ fullName });
  if (!success) {
    throw new ApiError(400, error.issues[0].message, []);
  }

  // Find user and update profile
  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      fullName,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password -refreshAccessToken");
  if (!user) {
    throw new Error(404, "User not found", []);
  }

  // return response
  return res
    .status(200)
    .json(new ApiResponse(200, "Name updated successfully", user));
});

const deleteUserAccount = asyncHandler(async (req, res) => {
  // Ensure user is authenticated and available in req.user
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized access", []);
  }

  // Find user and delete account
  const user = await UserModel.findByIdAndDelete(req.user._id);
  if (!user) {
    throw new Error(500, "Failed to delete account", []);
  }

  // return response
  return res
    .status(200)
    .json(new ApiResponse(200, "Account deleted successfully", []));
});

const changePassword = asyncHandler(async (req, res) => {
  // Ensure user is authenticated and available in req.user
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized access", []);
  }

  // get data from request body
  const { oldPassword, newPassword } = req.body;

  // validation with zod
  const { success, error } = changePasswordSchema.safeParse({
    oldPassword,
    newPassword,
  });
  if (!success) {
    throw new ApiError(400, error.issues[0].message, []);
  }

  // Find user and update password
  const user = await UserModel.findById(req.user._id);
  if (!user) {
    throw new Error(404, "User not found", []);
  }

  // check if the old password is correct
  const isPasswordMatched = await user.isPasswordMatched(oldPassword);
  if (!isPasswordMatched) {
    throw new ApiError(401, "Invalid old password", []);
  }

  // update password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully", []));
});

const verifyEmail = asyncHandler(async (req, res) => {
  // get token from the request
  const { token } = req.query;

  if (!token) {
    throw new ApiError(400, "Token is missing", []);
  }

  // find user by token
  const user = await UserModel.findOne({
    emailVerificationToken: token,
    emailVerificationTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired token", []);
  }

  // verify email
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationTokenExpiry = null;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Email verified successfully", []));
});

const forgetPasswordRequest = asyncHandler(async (req, res) => {
  // get user email from request

  const { email } = req.body;

  // validation with zod
  const { success, error } = emailSchema.safeParse({ email });
  if (!success) {
    throw new ApiError(400, error.issues[0].message, []);
  }

  // find user by email
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User doesn't exists with this email", []);
  }

  // send email
  await sendEmail(email, reset, user._id);

  // send response
  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset link sent to your email", []));
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
  // get token and new password from the request

  const { token } = req.query;
  const { newPassword } = req.body;

  // validation with zod
  const { success, error } = newPassowrdSchema.safeParse({
    newPassword,
  });
  if (!success) {
    throw new ApiError(400, error.issues[0].message, []);
  }

  // find user by token
  const user = await UserModel.findOne({
    forgetPasswordToken: token,
    forgetPasswordTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired token", []);
  }
  console.log(user);
  // update password
  user.password = newPassword;
  user.forgetPasswordToken = null;
  user.forgetPasswordTokenExpiry = null;
  await user.save({ validateBeforeSave: false });

  // send response
  return res
    .status(200)
    .json(new ApiResponse(200, "Password reset successfully", []));
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  // Ensure user is authenticated and available in req.user
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized access", []);
  }
  const user = await UserModel.findById(req.user._id);
  if (!user) {
    throw new Error(404, "User not found", []);
  }

  // send Email
  await sendEmail(user.email, verify, user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Verification email sent successfully", []));
});

// Exports controllers
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokens,
  getUserProfile,
  updateUserFullName,
  deleteUserAccount,
  changePassword,
  verifyEmail,
  forgetPasswordRequest,
  resetForgottenPassword,
  resendEmailVerification,
};
