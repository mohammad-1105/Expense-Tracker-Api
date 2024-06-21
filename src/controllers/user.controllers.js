import { asyncHandler } from "../utils/AsyncHandler.js";
import UserModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { registerUserSchema } from "../schemas/registerUserSchema.js";
import { loginUserSchema } from "../schemas/loginUserSchema.js";

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

// Exports controllers
export { registerUser, loginUser, logoutUser };
