import { asyncHandler } from "../utils/AsyncHandler.js";
import UserModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { registerUserSchema } from "../schemas/registerUserSchema.js";
import { loginUserSchema } from "../schemas/loginUserSchema.js";
import { changePasswordSchema } from "../schemas/changePasswordSchema.js";
import { updateFullNameSchema } from "../schemas/updateFullNameSchema.js";

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
  const { error } = registerUserSchema.safeParse({
    username,
    fullName,
    email,
    password,
  });
  if (error) {
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
    .json(new ApiResponse(201, "User registered successfully", user));
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from the request body
  const { username, email, password } = req.body;

  // validation with zod
  const { error } = loginUserSchema.safeParse({
    username,
    email,
    password,
  });

  if (error) {
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
    "-password -refreshAccessToken"
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
  const { error } = updateFullNameSchema.safeParse({fullName})
  if(error){
    throw new ApiError(400, error.issues[0].message, [])
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
  const { error } = changePasswordSchema.safeParse({
    oldPassword,
    newPassword,
  });
  if (error) {
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

// Exports controllers
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokens,
  getUserProfile,
  updateUserFullName,
  deleteUserAccount,
  changePassword
};
